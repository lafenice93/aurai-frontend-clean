"use client";
import { useEffect, useRef, useState } from "react";
import type { SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import { uploadSkinPhoto } from "@/app/lib/storage";
import { supabaseBrowser } from "@/app/lib/supabase";
import { type SkinAnalysis, skinMetricLabels } from "@/app/lib/skinAnalysis";

async function request(path: string, create: boolean): Promise<SkinAnalysis> {
  const { data: { session } } = await supabaseBrowser().auth.getSession();
  if (!session) throw new Error("로그인이 필요해요.");
  const response = await fetch(create ? "/api/skin-analysis" : `/api/skin-analysis?storagePath=${encodeURIComponent(path)}`, {
    method: create ? "POST" : "GET", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    ...(create ? { body: JSON.stringify({ storagePath: path }) } : {}), cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "분석 상태를 확인하지 못했어요.");
  return body;
}

export default function SkinPhotoAnalysis({ submission }: { submission: SkinPhotoSubmission }) {
  const snapshot = useRef(submission);
  const start = useRef<Promise<SkinAnalysis> | null>(null);
  const path = useRef<string | null>(submission.storagePath);
  const [result, setResult] = useState<SkinAnalysis | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [hasPath, setHasPath] = useState(Boolean(submission.storagePath));
  useEffect(() => {
    let active = true;
    // Shared promise survives StrictMode's effect replay. Never retry paid POST.
    start.current ??= (async () => {
      path.current ??= await uploadSkinPhoto(snapshot.current.photo.blob, snapshot.current.context);
      return request(path.current, true);
    })();
    void start.current.then(value => { if (active) { setHasPath(Boolean(path.current)); setResult(value); } }).catch(() => {
      if (active) { setHasPath(Boolean(path.current)); setError(path.current ? "접수 응답을 확인하지 못했어요. 상태 확인으로 기존 요청을 조회해 주세요." : "사진 업로드에 실패했어요. 사진을 다시 선택해 주세요."); }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!result || !["starting", "running"].includes(result.status) || error || !path.current) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void request(path.current!, false).then(value => { if (active) setResult(value); }).catch(() => { if (active) setError("결과 조회에 실패했어요. 상태 확인을 눌러 주세요."); });
    }, 10_000);
    return () => { active = false; window.clearTimeout(timer); };
  }, [result, error]);
  return <section data-testid="skin-analysis-result" aria-live="polite" className="skin-glass-card mt-4 space-y-3 p-5 text-[#F7EEE6]">
    <h3 className="text-[16px]">{result?.status === "success" ? "피부 분석 결과" : result?.status === "error" ? "피부 분석 실패" : result?.status === "uncertain" ? "분석 접수 확인 필요" : result ? "피부 분석 중이에요" : "사진 업로드 중이에요"}</h3>
    <p className="text-[13px] leading-relaxed">{error || result?.message || (result?.status === "success" ? "실제 반환된 분석 항목입니다." : "사진과 설문 정보를 이어서 처리하고 있어요.")}</p>
    {result?.status === "success" ? <dl className="space-y-2">{result.metrics?.map((item, index) => <div key={index} className="flex flex-wrap justify-between gap-2 text-[14px]"><dt>{skinMetricLabels[item.type] || item.type}{item.region ? ` (${item.region})` : ""}</dt><dd>{[item.ui_score !== undefined ? `UI 점수 ${item.ui_score}` : "", item.raw_score !== undefined ? `원본 점수 ${item.raw_score}` : "", item.skin_type || ""].filter(Boolean).join(" / ")}</dd></div>)}</dl> : null}
    {(error || result?.status === "uncertain") && hasPath ? <button type="button" disabled={checking} className="min-h-11 px-3 text-[14px] underline underline-offset-4" onClick={async () => {
      setChecking(true);
      try { setResult(await request(path.current!, false)); setError(""); }
      catch { setError("상태 조회에 실패했어요. 분석 요청은 다시 생성하지 않았어요."); }
      finally { setChecking(false); }
    }}>{checking ? "확인 중" : "분석 상태 확인"}</button> : null}
  </section>;
}
