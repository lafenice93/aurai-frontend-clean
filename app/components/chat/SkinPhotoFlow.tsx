"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinPhotoContext, SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import { CARD_GAP_MS } from "@/app/lib/reveal";
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
  const [session, setSession] = useState<{ id: number } | null>(null);
  const [waiting, setWaiting] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const sessionId = useRef(0);
  useEffect(() => {
    // 프로필 카드가 기존 카드 한 장의 등장 리듬으로 자리 잡은 뒤 카메라를 연다.
    const timer = window.setTimeout(() => {
      setWaiting(false);
      setSession({ id: ++sessionId.current });
    }, CARD_GAP_MS * 5);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (session) root.current?.querySelector('[data-testid="skin-photo-actions"]')?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session]);
  function updateContext(updated: SkinPhotoContext) {
    if (submission) {
      const next = { ...submission, context: updated };
      setSubmission(next);
      onConfirmed(next);
    }
    onContextChange(updated);
  }
  return <div ref={root} data-testid="skin-photo-flow" className="space-y-3 pb-4">
    <ConcernProfile context={context} canEdit={!submission} onUpdate={updateContext} />
    {submission ? <SkinPhotoAnalysis key={submission.photo.capturedAt} submission={submission} /> : null}
    {session ? <Appear after={0} key={session.id}>
      <SkinPhotoActions context={context} onConfirmed={confirmed => {
        setSubmission(confirmed);
        setSession(null);
        onConfirmed(confirmed);
      }} />
      <button type="button" className="mt-2 min-h-11 px-3 text-[14px] underline underline-offset-4" onClick={() => setSession(null)}>{submission ? "사진 변경 취소" : "카메라 닫기"}</button>
    </Appear> : submission ? <Appear after={0}><SkinProfileCard name={name} context={context} photo={submission.photo}
      onReselect={() => setSession({ id: ++sessionId.current })}
      onUpdate={updateContext} /></Appear> : !waiting ? <button type="button" className="min-h-11 px-3 text-[14px] underline underline-offset-4" onClick={() => setSession({ id: ++sessionId.current })}>카메라 열기</button> : null}
  </div>;
}
