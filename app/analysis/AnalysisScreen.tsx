"use client";

// [Web 전용] 제품 분석 결과 페이지: 식별된 제품 한 개의 핵심 성분·피부 궁합 점수·주의·사용 요약.
// 데이터는 채팅에서 sessionStorage로 넘어온다(handoff). 분석 자체는 서버(/api/product-fit)가 한다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Orb from "@/app/components/chat/Orb";
import { Star } from "@/app/components/chat/Sparkle";
import { analyzeProductFit } from "@/app/lib/api/products";
import { ko } from "@/app/lib/locale/ko";
import { fitTone, type FitTone } from "@/app/lib/products/fit";
import {
  loadAnalysisHandoff,
  routineAdd,
  routineHas,
  type AnalysisHandoff,
} from "@/app/lib/products/handoff";
import type { ProductFitResult } from "@/app/lib/schemas/productFit";

type Phase =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; result: ProductFitResult };

const SCORE_COLOR: Record<FitTone, string> = {
  high: "#F6E3CF",
  mid: "#F0DCC6",
  low: "rgb(247 238 230 / 0.7)",
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-[16px] px-4 py-3.5"
      style={{ background: "var(--bubble-fill)", border: "1px solid var(--bubble-stroke)" }}
    >
      <p className="mb-2 text-[12px] text-[#F7EEE6]/60">{title}</p>
      {children}
    </section>
  );
}

export default function AnalysisScreen({ id }: { id: string }) {
  const router = useRouter();
  const [handoff, setHandoff] = useState<AnalysisHandoff | null>(null);
  const [phase, setPhase] = useState<Phase>({ status: "loading" });
  const [added, setAdded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const data = id ? loadAnalysisHandoff(id) : null;

    // sessionStorage 접근은 렌더 밖에서. 없으면 안내만.
    const timer = setTimeout(async () => {
      if (!data) {
        setPhase({ status: "missing" });
        return;
      }
      setHandoff(data);
      setAdded(routineHas(id));
      setPhase({ status: "loading" });

      const outcome = await analyzeProductFit({
        product: {
          brand: data.product.brand,
          productName: data.product.productName,
          category: data.product.category,
          visibleText: data.product.visibleText,
        },
        skinType: data.skinType,
        concern: data.concern,
      });
      if (cancelled) return;
      setPhase(
        outcome.ok
          ? { status: "ready", result: outcome.result }
          : { status: "error", message: outcome.message ?? ko.ANALYSIS_FAILED },
      );
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, attempt]);

  const result = phase.status === "ready" ? phase.result : null;
  const name =
    result?.displayName ||
    [handoff?.product.brand, handoff?.product.productName].filter(Boolean).join(" ") ||
    ko.PRODUCTS_UNKNOWN_TITLE;
  const category = result?.category ?? handoff?.product.category ?? null;
  // "건성 피부 · 건조·각질 기준" — 있는 것만 이어 붙인다.
  const basisParts = result
    ? [result.skinTypeLabel ? `${result.skinTypeLabel} 피부` : null, result.concernLabel].filter(Boolean)
    : [];
  const basis = basisParts.length > 0 ? `${basisParts.join(" · ")} ${ko.ANALYSIS_BASIS_SUFFIX}` : null;

  function handleAdd() {
    if (!result || added) return;
    if (routineAdd(id, result.displayName)) {
      setAdded(true);
    }
  }

  return (
    <main
      className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "var(--bg-glow)" }} />

      <header
        className="relative flex shrink-0 items-center gap-2 px-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={ko.ANALYSIS_BACK}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#F8EDE4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8EDE4]"
        >
          <BackIcon />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}>
        {/* 타이틀 + 구슬 */}
        <div className="relative flex items-start justify-between pt-2">
          <div className="pr-4">
            <h1 className="flex items-center gap-2 text-[22px] leading-tight">
              {ko.ANALYSIS_TITLE}
              <span aria-hidden="true" className="text-[14px]" style={{ textShadow: "var(--sparkle-glow)" }}>✦</span>
            </h1>
            <p className="mt-2 text-[12px] leading-[1.5] text-[#F7EEE6]/70" style={{ wordBreak: "keep-all" }}>
              {ko.ANALYSIS_SUBTITLE}
            </p>
          </div>
          <div className="relative -mt-1 shrink-0">
            <Orb size={64} />
            <Star size={3} style={{ left: "-10%", top: "20%" }} rays={{ x: 9, y: 9 }} />
            <Star size={2} style={{ left: "105%", top: "70%" }} />
          </div>
        </div>

        {phase.status === "missing" ? (
          <div className="mt-8 space-y-4 text-center text-[13px] text-[#F7EEE6]/75">
            <p style={{ wordBreak: "keep-all" }}>{ko.ANALYSIS_MISSING}</p>
            <Link href="/chat" className="inline-block underline underline-offset-4">
              {ko.ANALYSIS_BACK}
            </Link>
          </div>
        ) : null}

        {handoff ? (
          <>
            {/* 제품 히어로 카드 */}
            <section
              className="mt-5 flex gap-3 rounded-[18px] p-3"
              style={{ background: "var(--bubble-fill)", border: "1.3px solid var(--bubble-stroke)" }}
              data-testid="analysis-hero"
            >
              {/* 크기는 인라인으로 고정 — 세로로 긴 촬영 crop이 카드를 늘리지 않게. */}
              <div
                className="relative shrink-0 overflow-hidden"
                style={{
                  width: 128,
                  height: 148,
                  borderRadius: 12,
                  background:
                    "radial-gradient(ellipse 80% 55% at 50% 30%, rgb(255 236 214 / 0.55), transparent 70%), linear-gradient(180deg, #D9B896 0%, #C39B74 60%, #A77E5A 100%)",
                  border: "1px solid rgb(255 225 195 / 0.22)",
                }}
              >
                {handoff.thumb ? (
                  // 공식 패키지컷(배경 제거 PNG)은 타일 위에 놓인 것처럼, 촬영 crop은 타일을 채운다.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={handoff.thumb}
                    alt=""
                    style={
                      handoff.thumb.startsWith("/api/")
                        ? { width: "100%", height: "100%", objectFit: "contain", padding: 10, filter: "drop-shadow(0 8px 12px rgb(60 30 10 / 0.35))" }
                        : { width: "100%", height: "100%", objectFit: "cover" }
                    }
                  />
                ) : null}
              </div>

              {/* 글은 전부 왼쪽 정렬 */}
              <div className="flex min-w-0 flex-1 flex-col items-start text-left" style={{ gap: 6 }}>
                <span
                  className="inline-flex items-center rounded-full text-[#F7EEE6]/80"
                  style={{ gap: 6, padding: "4px 10px", fontSize: 10, background: "rgb(174 126 91 / 0.28)", border: "1px solid var(--bubble-stroke)" }}
                >
                  <span aria-hidden="true">✦</span>
                  {ko.ANALYSIS_TAG}
                </span>
                <p className="text-[17px] leading-tight" style={{ wordBreak: "keep-all" }} data-testid="analysis-name">
                  {name}
                </p>
                {category ? <p className="text-[12px] text-[#F7EEE6]/60">{category}</p> : null}

                <div className="mt-auto" style={{ paddingTop: 4 }}>
                  <p className="text-[11px] text-[#F7EEE6]/60">{ko.ANALYSIS_FIT}</p>
                  {result && result.fitScore !== null ? (
                    <p className="leading-none" data-testid="analysis-score">
                      <span
                        className="font-medium tracking-tight"
                        style={{ fontSize: 40, color: SCORE_COLOR[fitTone(result.fitScore)], textShadow: "0 0 18px rgb(255 226 190 / 0.35)" }}
                      >
                        {result.fitScore}
                      </span>
                      <span className="text-[14px] text-[#F7EEE6]/80" style={{ marginLeft: 2 }}>{ko.ANALYSIS_POINT}</span>
                    </p>
                  ) : (
                    <p className="leading-none text-[#F7EEE6]/40" style={{ fontSize: 26 }}>
                      {phase.status === "loading" ? "…" : "—"}
                    </p>
                  )}
                  {basis ? <p className="text-[10px] text-[#F7EEE6]/50" style={{ marginTop: 4 }}>{basis}</p> : null}
                </div>
              </div>
            </section>

            {phase.status === "loading" ? (
              <p className="mt-6 text-center text-[13px] text-[#F7EEE6]/70" data-testid="analysis-loading">
                {ko.ANALYSIS_LOADING}
              </p>
            ) : null}

            {phase.status === "error" ? (
              <div className="mt-6 space-y-3 text-center text-[13px] text-[#F7EEE6]/75">
                <p>{phase.message}</p>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="cursor-pointer rounded-[12px] px-4 py-2.5 text-sm"
                  style={{ background: "var(--bubble-fill)", border: "1px solid var(--bubble-stroke)" }}
                >
                  {ko.RETRY}
                </button>
              </div>
            ) : null}

            {result ? (
              <div className="mt-4 space-y-3">
                {result.fitScore === null ? (
                  <p className="px-1 text-[12px] leading-[1.5] text-[#F7EEE6]/70" style={{ wordBreak: "keep-all" }}>
                    {ko.ANALYSIS_UNKNOWN_SCORE}
                  </p>
                ) : null}

                {result.keyIngredients.length > 0 ? (
                  <Section title={ko.ANALYSIS_INGREDIENTS}>
                    <ul className="flex flex-wrap gap-2">
                      {result.keyIngredients.map((item) => (
                        <li
                          key={item.name}
                          className="rounded-full px-3 py-1.5 text-[12px] text-[#F7EEE6]/90"
                          style={{ background: "rgb(255 233 210 / 0.12)", border: "1px solid var(--bubble-stroke)" }}
                          title={item.role}
                        >
                          {item.name}
                          <span className="ml-1.5 text-[10px] text-[#F7EEE6]/55">{item.role}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}

                {result.positives.length > 0 ? (
                  <Section title={ko.ANALYSIS_POSITIVES}>
                    <ul className="space-y-1.5">
                      {result.positives.map((line) => (
                        <li key={line} className="flex gap-2 text-[12px] leading-[1.45] text-[#F7EEE6]/85" style={{ wordBreak: "keep-all" }}>
                          <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}

                {result.cautions.length > 0 ? (
                  <Section title={ko.ANALYSIS_CAUTIONS}>
                    <ul className="space-y-1.5">
                      {result.cautions.map((line) => (
                        <li key={line} className="flex gap-2 text-[12px] leading-[1.45] text-[#F7EEE6]/85" style={{ wordBreak: "keep-all" }}>
                          <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "#F4D2BB" }} />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}

                <Section title={ko.ANALYSIS_USAGE}>
                  <p className="text-[13px] leading-[1.5] text-[#F7EEE6]/90" style={{ wordBreak: "keep-all" }}>
                    {result.fitSummary}
                  </p>
                  {result.usage ? (
                    <p className="mt-1.5 text-[12px] leading-[1.5] text-[#F7EEE6]/70" style={{ wordBreak: "keep-all" }}>
                      {result.usage}
                    </p>
                  ) : null}
                </Section>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={added || result.fitScore === null}
                  data-testid="analysis-add"
                  className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-1 rounded-[14px] text-[15px] font-medium text-[#3B2418] transition-transform duration-150 ease-out active:scale-[0.98] disabled:cursor-default disabled:opacity-70"
                  style={{
                    background: "linear-gradient(180deg, #F6E3CF 0%, var(--accent) 100%)",
                    border: "1px solid var(--gold-line)",
                    boxShadow: "0 0 18px rgb(255 226 190 / 0.35)",
                  }}
                >
                  {added ? ko.ANALYSIS_ADDED : ko.ANALYSIS_ADD_ROUTINE}
                  {added ? null : <span aria-hidden="true">›</span>}
                </button>

                <p className="px-1 pt-1 text-[10px] leading-[1.5] text-[#F7EEE6]/45" style={{ wordBreak: "keep-all" }}>
                  {ko.ANALYSIS_DISCLAIMER}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
