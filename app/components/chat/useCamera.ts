"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraErrorKind = "unsupported" | "insecure" | "denied" | "not-found" | "failed" | "switch-failed";
export type CameraStatus = "idle" | "starting" | "live" | "error";
export type CameraDevice = { deviceId: string; label: string };
type Facing = "user" | "environment";

function classify(error: unknown): CameraErrorKind {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "not-found";
  return "failed";
}
function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function waitForFrame(video: HTMLVideoElement, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const clean = () => {
      clearTimeout(timer);
      video.removeEventListener("loadeddata", check);
      video.removeEventListener("resize", check);
      signal.removeEventListener("abort", abort);
    };
    const check = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        clean();
        resolve();
      }
    };
    const abort = () => { clean(); reject(new DOMException("superseded", "AbortError")); };
    const timer = setTimeout(() => { clean(); reject(new Error("Camera frame unavailable")); }, 10_000);
    video.addEventListener("loadeddata", check);
    video.addEventListener("resize", check);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else check();
  });
}

/** 요청·장치 조회·재생까지 같은 세대로 관리해 닫힌 카드에 늦은 스트림이 붙지 않게 한다. */
export function useCamera(active: boolean, initialFacing: Facing = "environment") {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<AbortController | null>(null);
  const preferredRef = useRef<string | null>(null);
  const facingRef = useRef<Facing>(initialFacing);
  const requestRef = useRef(0);
  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<CameraErrorKind | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  const release = useCallback(() => {
    requestRef.current += 1;
    connectionRef.current?.abort();
    connectionRef.current = null;
    busyRef.current = false;
    stopTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const stopCamera = useCallback(() => { release(); setStatus("idle"); }, [release]);

  const connect = useCallback(async (deviceId: string | null, facing: Facing, switching = false) => {
    if (!activeRef.current || busyRef.current || document.visibilityState === "hidden") return;
    release();
    const request = requestRef.current;
    const connection = new AbortController();
    connectionRef.current = connection;
    const current = () => request === requestRef.current && activeRef.current;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext ? "unsupported" : "insecure");
      setStatus("error");
      return;
    }
    busyRef.current = true;
    setStatus("starting");
    setError(null);
    const previous = preferredRef.current;
    const previousFacing = facingRef.current;

    const open = async (id: string | null, mode: Facing) => {
      stopTracks(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: id ? { deviceId: { exact: id } } : { facingMode: { ideal: mode } },
      });
      if (!current()) {
        stopTracks(stream);
        throw new DOMException("superseded", "AbortError");
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video was removed");
      // Set before srcObject as well as in JSX for mobile Safari playback.
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      await waitForFrame(video, connection.signal);
      // 장치 목록을 못 읽는 브라우저에서도 이미 열린 카메라는 사용할 수 있다.
      const list = await (navigator.mediaDevices.enumerateDevices?.() ?? Promise.resolve([])).then((all) => all
        .filter((device) => device.kind === "videoinput")
        .filter((device, index, all) => device.deviceId && all.findIndex(item => item.deviceId === device.deviceId) === index)
        .map((device, index) => ({ deviceId: device.deviceId, label: device.label || `카메라 ${index + 1}` })))
        .catch(() => []);
      if (!current()) throw new DOMException("superseded", "AbortError");
      const settings = stream.getVideoTracks()[0]?.getSettings();
      const chosen = settings?.deviceId ?? id;
      preferredRef.current = chosen;
      facingRef.current = settings?.facingMode === "environment" ? "environment"
        : settings?.facingMode === "user" ? "user" : mode;
      setActiveDeviceId(chosen);
      setDevices(list);
      setStatus("live");
    };

    try {
      await open(deviceId, facing);
    } catch (caught) {
      if (!current()) return;
      try {
        if (switching) {
          await open(previous, previousFacing);
          if (current()) setError("switch-failed");
        } else if (deviceId && classify(caught) === "not-found") {
          await open(null, initialFacing);
        } else throw caught;
      } catch (failure) {
        if (!current()) return;
        stopTracks(streamRef.current);
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setError(classify(failure));
        setStatus("error");
      }
    } finally {
      if (current()) busyRef.current = false;
    }
  }, [initialFacing, release]);

  const startCamera = useCallback(() => connect(preferredRef.current, facingRef.current), [connect]);
  const selectCamera = useCallback((deviceId: string) => {
    if (deviceId === preferredRef.current) return Promise.resolve();
    const nextFacing = facingRef.current === "user" ? "environment" : "user";
    return connect(deviceId, nextFacing, true);
  }, [connect]);
  const switchCamera = useCallback(() => {
    if (devices.length < 2) return Promise.resolve();
    const nextFacing = facingRef.current === "user" ? "environment" : "user";
    // 휴대폰의 여러 후면 렌즈를 순환하기 전에 반대 방향의 카메라를 우선한다.
    const direction = nextFacing === "environment" ? /back|rear|environment|후면/i : /front|user|전면/i;
    const opposite = devices.find((device) => device.deviceId !== activeDeviceId && direction.test(device.label));
    if (opposite) return selectCamera(opposite.deviceId);
    // Localized/hidden device labels must not cycle among rear lenses only.
    return connect(null, nextFacing, true);
  }, [devices, activeDeviceId, selectCamera, connect]);

  useEffect(() => {
    activeRef.current = active;
    if (!active) return;
    const timer = setTimeout(() => void startCamera(), 0);
    const onVisibility = () => document.visibilityState === "hidden" ? stopCamera() : void startCamera();
    const onPageHide = () => stopCamera();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onVisibility);
    return () => {
      activeRef.current = false;
      clearTimeout(timer);
      release();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onVisibility);
    };
  }, [active, startCamera, stopCamera, release]);

  return { videoRef, status, error, devices, activeDeviceId, startCamera, stopCamera, switchCamera, selectCamera };
}
