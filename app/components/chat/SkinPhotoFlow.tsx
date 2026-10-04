"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinPhotoContext, SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import type { CapturedPhoto } from "@/app/lib/camera/types";
import { fileToPhoto } from "@/app/lib/camera/capture";
import { ko } from "@/app/lib/locale/ko";
import Appear from "./Appear";
import ConcernProfile from "./ConcernProfile/ConcernProfile";
import SkinPhotoActions from "./SkinPhotoActions";
import SkinProfileCard from "./SkinProfileCard";
import SkinPhotoAnalysis from "./SkinPhotoAnalysis";

export default function SkinPhotoFlow({ name, context, onConfirmed, onContextChange }: {
  name?: string;
  context: SkinPhotoContext;
  onConfirmed: (submission: SkinPhotoSubmission) => void;
  onContextChange: (context: SkinPhotoContext) => void;
}) {
  const [submission, setSubmission] = useState<SkinPhotoSubmission | null>(null);
  const [session, setSession] = useState<{ id: number; photo?: CapturedPhoto } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const sessionId = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (session) root.current?.querySelector('[data-testid="skin-photo-actions"]')?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session]);
  async function selectFile(file?: File) {
    if (!file || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const photo = await fileToPhoto(file);
      if (mounted.current) setSession({ id: ++sessionId.current, photo });
    } catch {
      if (mounted.current) setError(ko.CAMERA_FILE_FAILED);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function updateContext(updated: SkinPhotoContext) {
    if (submission) {
      const next = { ...submission, context: updated };
      setSubmission(next);
      onConfirmed(next);
    }
    onContextChange(updated);
  }
  return <div ref={root} data-testid="skin-photo-flow" className="space-y-3 pb-4">
    <ConcernProfile context={context} busy={busy} canEdit={!submission} onUpdate={updateContext}
      onUpload={() => input.current?.click()} onCamera={() => {
        setError(null);
        if (!session || session.photo) setSession({ id: ++sessionId.current });
        else root.current?.querySelector('[data-testid="skin-photo-actions"]')?.scrollIntoView({ behavior: "smooth", block: "end" });
      }} />
    <input ref={input} type="file" accept="image/*" className="hidden" aria-label="사진 업로드" data-testid="concern-file" onChange={event => {
      void selectFile(event.target.files?.[0]);
      event.target.value = "";
    }} />
    {busy ? <p role="status" className="px-4 text-[14px]">사진을 불러오고 있어요.</p> : null}
    {error ? <p role="alert" className="px-4 text-[14px]">{error}</p> : null}
    {submission ? <SkinPhotoAnalysis key={submission.photo.capturedAt} submission={submission} /> : null}
    {session ? <Appear after={0} key={session.id}>
      <SkinPhotoActions context={context} initialPhoto={session.photo} onConfirmed={confirmed => {
        setSubmission(confirmed);
        setSession(null);
        onConfirmed(confirmed);
      }} />
      <button type="button" className="mt-2 min-h-11 px-3 text-[14px] underline underline-offset-4" onClick={() => setSession(null)}>{submission ? "사진 변경 취소" : "카메라 닫기"}</button>
    </Appear> : submission ? <Appear after={0}><SkinProfileCard name={name} context={context} photo={submission.photo}
      onReselect={() => root.current?.querySelector('[data-testid="concern-photo-request"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}
      onUpdate={updateContext} /></Appear> : null}
  </div>;
}
