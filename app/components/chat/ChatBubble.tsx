"use client";

import { useEffect, useRef, useState } from "react";
import { LINE_MS, WORD_MS } from "@/app/lib/reveal";
import type { SkinTypeIcon } from "@/app/lib/skinTypes";
import AssistantAvatar from "./AssistantAvatar";
import AssistantBubbleShape from "./AssistantBubbleShape";
import AlternatingAssistantText from "./AlternatingAssistantText";
import BubbleBorderSparkle from "./BubbleBorderSparkle";
import StarLight from "./StarLight";
import { SkinIcon } from "./icons";
import { BorderGlint, Twinkle, useReducedMotion } from "./Sparkle";

type ChatBubbleProps = {
  role: "user" | "assistant";
  lines: string[];
  decorated?: boolean;
  icon?: SkinTypeIcon;
  selectionSummary?: boolean;
  /** 텍스트가 드러나기 시작하는 시각(epoch ms). 없으면 마운트 즉시. */
  revealAt?: number;
};

export default function ChatBubble({
  role,
  lines,
  decorated = false,
  icon,
  selectionSummary = false,
  revealAt,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const characterCount = Array.from(lines.join("").replace(/[\r\n]/g, "")).length;
  const innerShadowOpacity = characterCount <= 7 ? 0.0375 : 0.05;
  const reduced = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [visualLineCount, setVisualLineCount] = useState(1);
  const innerRange = visualLineCount >= 4 ? 2.25 : visualLineCount === 3 ? 1.95 : visualLineCount === 2 ? 1.5 : 1;
  // 예약 시각까지는 말풍선 자체를 그리지 않는다. 시각이 되면 말풍선과 글자가 함께 등장한다.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const timer = setTimeout(
      () => setStarted(true),
      Math.max(0, (revealAt ?? now) - now),
    );
    return () => clearTimeout(timer);
  }, [revealAt]);

  useEffect(() => {
    if (started) {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [started]);

  useEffect(() => {
    const text = textRef.current;
    if (!started || !text) return;
    const measure = () => {
      const paragraph = text.querySelector("p");
      if (!paragraph) return;
      const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
      if (Number.isFinite(lineHeight) && lineHeight > 0) {
        setVisualLineCount(Math.max(1, Math.round(text.offsetHeight / lineHeight)));
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    measure();
    return () => observer.disconnect();
  }, [started, lines]);

  if (!started) {
    return null;
  }

  return (
    <div
      ref={rowRef}
      className={`smudge-block reveal-scroll flex items-start ${isUser ? "justify-end" : "justify-start"}`}
      style={{ gap: "var(--avatar-bubble-gap)" }}
    >
      {isUser ? null : <AssistantAvatar ringAccents />}

      <div
        className="relative min-w-0"
        style={{
          background: isUser
            ? "linear-gradient(180deg, rgb(211 147 104 / 0.15) 0%, var(--bubble-fill) 30%, var(--bubble-fill) 70%, rgb(211 147 104 / 0.15) 100%)"
            : undefined,
          boxShadow: isUser
            ? `inset 0 0 ${8 * innerRange}px color-mix(in srgb, var(--bubble-stroke) 65%, transparent), inset 0 3px ${10 * innerRange}px color-mix(in srgb, var(--bubble-stroke) ${innerShadowOpacity * 600}%, transparent), inset 0 -3px ${10 * innerRange}px color-mix(in srgb, var(--bubble-stroke) ${innerShadowOpacity * 600}%, transparent), 0 3px 8px rgb(88 48 26 / 0.05)`
            : undefined,
          // AI의 면과 선은 SVG 한 경로가 그린다. 투명 테두리는 기존 여백을 유지한다.
          border: `1px solid ${isUser ? "var(--bubble-stroke)" : "transparent"}`,
          borderRadius: "var(--bubble-radius)",
          // 문장이 여럿인 말풍선은 위아래를 9px 더 띄운다.
          padding:
            lines.length > 1
              ? "var(--bubble-padding-multi)"
              : "var(--bubble-padding)",
          maxWidth: isUser ? "78%" : undefined,
          // 첫인사 장식과 오른쪽 외곽선이 놓일 여백.
          marginRight: isUser ? undefined : decorated ? "52px" : "9px",
        }}
      >
        {isUser ? null : <AssistantBubbleShape champagne={decorated} innerShadowOpacity={innerShadowOpacity} innerRange={innerRange} />}

        <div className={icon ? "relative flex items-center gap-2" : "relative"}>
          <div
            ref={textRef}
            className="bubble-text"
            style={decorated && !isUser ? { transform: "translateX(5px)" } : undefined}
          >
            {isUser || decorated ? lines.map((line, lineIndex) => {
              const separatorIndex = selectionSummary ? line.indexOf(" | ") : -1;
              if (separatorIndex !== -1) {
                return (
                  <p
                    key={lineIndex}
                    className="flex items-center justify-center gap-[12px] text-[15px] leading-[1.4]"
                    style={{ color: "var(--text-primary)", wordBreak: "keep-all" }}
                  >
                    <span>{line.slice(0, separatorIndex).trim()}</span>
                    <span
                      aria-hidden="true"
                      className="h-[15px] w-[2px] shrink-0 rounded-[999px] bg-current opacity-80"
                    />
                    <span>{line.slice(separatorIndex + 3).trim()}</span>
                  </p>
                );
              }
              return (
                <p
                key={lineIndex}
                className="text-[15px] leading-[1.4]"
                // pre-line: AI 답변의 목록 줄바꿈(문단 안 \n)을 살린다.
                style={{ color: "var(--text-primary)", wordBreak: "keep-all", whiteSpace: "pre-line", overflowWrap: "anywhere" }}
              >
                {reduced
                  ? line
                  : line.split(" ").map((word, wordIndex, words) => (
                      <span key={wordIndex}>
                        <span
                          className="smudge-word"
                          style={{
                            animationDelay: `${lineIndex * LINE_MS + wordIndex * WORD_MS}ms`,
                          }}
                        >
                          {word}
                        </span>
                        {wordIndex < words.length - 1 ? " " : null}
                      </span>
                    ))}
                </p>
              );
            }) : <AlternatingAssistantText lines={lines} reduced={reduced} />}
          </div>
          {icon ? (
            <SkinIcon name={icon} size={20} className="shrink-0 text-[#F0DCC6]/85" />
          ) : null}
        </div>

        {decorated ? (
          <>
            <BubbleBorderSparkle side="left" />
            <BubbleBorderSparkle side="right" />
            <Twinkle
              centered
              maxOpacity={0.7}
              startDelay={900}
              className="pointer-events-none absolute overflow-visible"
              style={{ left: "61%", top: "82%", width: 6, height: 6 }}
            >
              <StarLight className="absolute" style={{ left: "50%", top: "50%", width: 24, height: 16.5, transform: "translate(-50%, -50%)" }} />
            </Twinkle>
            <BorderGlint />
          </>
        ) : null}
      </div>

    </div>
  );
}
