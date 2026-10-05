"use client";

// Desktop and mobile browsers share this camera UI and stream/capture hooks.
import { useEffect, useRef, useState } from "react";
import { captureVideoFrame, fileToPhoto } from "@/app/lib/camera/capture";
import type { CapturedPhoto } from "@/app/lib/camera/types";
import { ko } from "@/app/lib/locale/ko";
import { useCamera, type CameraErrorKind } from "./useCamera";

function TagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 11.2V4.5a1 1 0 0 1 1-1h6.7a1 1 0 0 1 .7.3l8.3 8.3a1 1 0 0 1 0 1.4l-6.7 6.7a1 1 0 0 1-1.4 0L3.8 11.9a1 1 0 0 1-.3-.7Z" />
      <circle cx="7.8" cy="7.8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-13.7-5.3L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 13.7 5.3L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="m20.5 15.5-4.6-4.6a1 1 0 0 0-1.4 0L7 18.5" />
    </svg>
  );
}

const ERROR_MESSAGE: Record<CameraErrorKind, string> = {
  unsupported: ko.CAMERA_UNSUPPORTED,
  insecure: ko.CAMERA_INSECURE,
  denied: ko.CAMERA_DENIED,
  "not-found": ko.CAMERA_NOT_FOUND,
  failed: ko.CAMERA_FAILED,
  "switch-failed": ko.CAMERA_SWITCH_FAILED,
};

type Preview = { photo: CapturedPhoto; url: string };

export default function CameraCard({
  onUsePhoto,
  purpose = "product",
  initialPhoto,
  autoStart = true,
}: {
  /** "이 사진 사용" — Blob을 그대로 넘긴다. 분석 연결은 다음 단계. */
  onUsePhoto: (photo: CapturedPhoto) => void;
  purpose?: "product" | "skin";
  initialPhoto?: CapturedPhoto;
  autoStart?: boolean;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const handling = useRef(false);
  const confirmed = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [albumThumbnail, setAlbumThumbnail] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 미리보기·완료 중에는 카메라를 끈다(LED 꺼짐). 다시 촬영하면 같은 카메라로 다시 켠다.
  const camera = useCamera(autoStart && preview === null && !initialPhoto && !done, purpose === "skin" ? "user" : "environment");
  useEffect(() => {
    if (!initialPhoto) return;
    const url = URL.createObjectURL(initialPhoto.blob);
    const thumbnail = URL.createObjectURL(initialPhoto.blob);
    // Synchronize browser-owned Blob URLs with a file chosen outside the camera.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview({ photo: initialPhoto, url });
    setAlbumThumbnail(thumbnail);
    return () => { URL.revokeObjectURL(url); URL.revokeObjectURL(thumbnail); };
  }, [initialPhoto]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const { videoRef, status, error, devices } = camera;

  // Object URL은 더 쓰지 않을 때(교체·unmount) 반드시 해제한다.
  useEffect(() => {
    if (!preview) {
      return;
    }
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  // Separate from the large preview so retaking keeps the last selected album image.
  useEffect(() => {
    if (!albumThumbnail) return;
    return () => URL.revokeObjectURL(albumThumbnail);
  }, [albumThumbnail]);

  function show(photo: CapturedPhoto) {
    if (!mounted.current) return;
    camera.stopCamera();
    setCaptureError(null);
    if (photo.source === "file") setAlbumThumbnail(URL.createObjectURL(photo.blob));
    setPreview({ photo, url: URL.createObjectURL(photo.blob) });
  }

  async function handleShutter() {
    const video = videoRef.current;
    if (handling.current || status !== "live" || !video) return;
    handling.current = true;
    setBusy(true);
    try {
      show(await captureVideoFrame(video));
    } catch {
      if (mounted.current) setCaptureError(ko.CAMERA_CAPTURE_FAILED);
    } finally {
      handling.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file || handling.current) return;
    handling.current = true;
    setBusy(true);
    try {
      show(await fileToPhoto(file));
    } catch {
      if (mounted.current) setCaptureError(ko.CAMERA_FILE_FAILED);
    } finally {
      handling.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function handleRetake() {
    if (purpose === "skin" && preview?.photo.source === "file") {
      galleryRef.current?.click();
      return;
    }
    // preview를 비우면 effect가 URL을 해제하고, useCamera(active=true)가 카메라를 다시 켠다.
    setCaptureError(null);
    setPreview(null);
  }

  function handleUse() {
    if (!preview || confirmed.current) return;
    confirmed.current = true;
    camera.stopCamera();
    setDone(true);
    onUsePhoto(preview.photo);
  }

  const isLive = status === "live";
  const canShoot = isLive && !busy;
  const overlay =
    captureError ??
    (status === "error" && error ? ERROR_MESSAGE[error] : null) ??
    (status === "starting" || status === "idle" ? ko.CAMERA_STARTING : null);
  // 전환 실패는 카메라가 살아 있으므로 프레임 아래에 작게만 알린다.
  const notice = status === "live" && error === "switch-failed" ? ERROR_MESSAGE[error] : null;

  return (
    <section
      data-testid={purpose === "skin" ? "skin-camera-card" : "product-camera-card"}
      className="skin-glass-card reveal-scroll overflow-hidden"
    >
      <p className="px-5 py-3 break-keep text-center text-[12px] leading-relaxed text-[#F7EEE6]/90">
        {purpose === "skin" ? ko.SKIN_CAMERA_LIGHT_HINT : ko.CAMERA_HINT}
      </p>

      <div
        className={`relative mx-4 overflow-hidden rounded-[12px] ${status === "error" && !preview ? "h-[280px]" : "aspect-[4/3]"}`}
        style={{
          background:
            "linear-gradient(160deg, rgb(255 233 210 / 0.18), rgb(120 74 46 / 0.30))",
          border: "1px solid rgb(255 225 195 / 0.18)",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt={purpose === "skin" ? ko.SKIN_PHOTO_PREVIEW_ALT : ko.CAMERA_PREVIEW_ALT}
            data-testid="camera-preview"
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="카메라 미리보기"
            data-testid="camera-video"
            style={{ transform: "scaleX(-1)" }}
            className={`h-full w-full object-cover ${isLive ? "" : "opacity-0"}`}
          />
        )}

        {!preview && overlay ? (
          <div
            role="status"
            data-testid="camera-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 break-keep px-6 text-center text-[12px] leading-relaxed whitespace-pre-line text-[#F7EEE6]/90"
          >
            <p>{overlay}</p>
            {status === "error" ? (
              <>
                <p className="text-[#F7EEE6]/85">{ko.CAMERA_FALLBACK_HINT}</p>
                {error === "insecure" && process.env.NODE_ENV === "development" ? <button type="button" data-testid="camera-open-https"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.protocol = "https:";
                    url.port = "3443";
                    window.location.assign(url.href);
                  }}
                  className="min-h-11 cursor-pointer rounded-[12px] px-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: "var(--bubble-fill)", border: "1px solid var(--bubble-stroke)" }}>
                  {ko.CAMERA_OPEN_HTTPS}
                </button> : <button type="button" onClick={() => void camera.startCamera()}
                  data-testid="camera-retry"
                  className="min-h-11 cursor-pointer rounded-[12px] px-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: "var(--bubble-fill)", border: "1px solid var(--bubble-stroke)" }}>
                  {ko.RETRY}
                </button>}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="px-5 pt-2 text-center text-[11px] text-[#F7EEE6]/60">
          {notice}
        </p>
      ) : null}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        aria-label={ko.CAMERA_GALLERY_LABEL}
        data-testid="camera-file"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex items-center gap-2 px-4 pt-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-[#F7EEE6]/80"
          style={{
            background: "rgb(174 126 91 / 0.28)",
            border: "1px solid var(--bubble-stroke)",
          }}
        >
          <TagIcon />
          {purpose === "skin" ? "고민되는 부위가 잘 보이도록 맞춰 주세요." : ko.CAMERA_TAG}
        </span>

        {/* 카메라가 셋 이상(데스크톱 외장 웹캠 등)일 때만 고를 수 있는 작은 선택기 */}
        {!preview && devices.length > 2 ? (
          <select
            aria-label={ko.CAMERA_SELECT_LABEL}
            data-testid="camera-select"
            value={camera.activeDeviceId ?? ""}
            onChange={(event) => void camera.selectCamera(event.target.value)}
            className="ml-auto max-w-[45%] truncate rounded-full bg-transparent px-2.5 py-1.5 text-[11px] text-[#F7EEE6]/80"
            style={{ border: "1px solid var(--bubble-stroke)" }}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {done && purpose === "skin" ? <p role="status" className="px-4 pt-3 text-center text-[12px]">{ko.SKIN_PHOTO_CONFIRMED}</p> : null}
      {preview ? (
        <div className="flex items-center justify-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={handleRetake}
            disabled={done}
            data-testid="camera-retake"
            className="h-11 flex-1 cursor-pointer rounded-[12px] text-[14px] text-[#F7EEE6]/90 transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              background: "var(--bubble-fill)",
              border: "1px solid var(--bubble-stroke)",
            }}
          >
            {purpose === "skin" ? preview.photo.source === "file" ? "다시 선택" : "다시 촬영" : ko.CAMERA_RETAKE}
          </button>
          <button
            type="button"
            onClick={handleUse}
            disabled={done}
            data-testid="camera-use"
            className="h-11 flex-1 cursor-pointer rounded-[12px] text-[14px] font-medium text-[#3B2418] transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(180deg, #F6E3CF 0%, var(--accent) 100%)",
              border: "1px solid var(--gold-line)",
              boxShadow: "0 0 14px rgb(255 226 190 / 0.35)",
            }}
          >
            {purpose === "skin" ? ko.SKIN_PHOTO_USE : ko.CAMERA_USE_PHOTO}
          </button>
        </div>
      ) : null}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={busy || done}
            data-testid="camera-gallery"
            aria-label={ko.CAMERA_GALLERY_LABEL}
            className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-[8px] text-[#F7EEE6]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]"
            style={{
              background: "rgb(255 233 210 / 0.20)",
              border: "1px solid var(--bubble-stroke)",
            }}
          >
            {albumThumbnail ? (
              // The user's selected photo stays in this browser; no image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={albumThumbnail} alt="" aria-hidden="true" draggable={false}
                data-testid="camera-gallery-thumbnail" className="h-full w-full object-cover" />
            ) : <GalleryIcon />}
          </button>

          <button
            type="button"
            onClick={() => void handleShutter()}
            disabled={!canShoot}
            aria-label={ko.CAMERA_SHUTTER_LABEL}
            data-testid="camera-shutter"
            className="h-[58px] w-[58px] cursor-pointer rounded-full transition-transform duration-150 ease-out active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7EEE6] disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              background:
                "radial-gradient(circle at 42% 34%, #FFFFFF 0%, #F6EDE3 60%, #E4D3C3 100%)",
              boxShadow: "0 0 14px rgb(255 226 190 / 0.45)",
            }}
          />

          {/* 카메라가 하나면 같은 위치에서 비활성화해 셔터를 가운데 유지한다. */}
            <button
              type="button"
              onClick={() => void camera.switchCamera()}
              disabled={status !== "live" || devices.length < 2 || busy}
              aria-label={ko.CAMERA_FLIP_LABEL}
              data-testid="camera-flip"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-[#F7EEE6]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ border: "1px solid var(--bubble-stroke)" }}
            >
              <FlipIcon />
            </button>
        </div>
    </section>
  );
}
