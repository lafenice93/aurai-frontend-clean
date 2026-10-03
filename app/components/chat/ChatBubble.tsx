"use client";

import { useEffect, useRef, useState } from "react";
import { LINE_MS, WORD_MS } from "@/app/lib/reveal";
import type { SkinTypeIcon } from "@/app/lib/skinTypes";
import AssistantBubbleShape from "./AssistantBubbleShape";
import AlternatingAssistantText from "./AlternatingAssistantText";
import { SkinIcon } from "./icons";
import { BorderGlint, Star, useReducedMotion } from "./Sparkle";

type ChatBubbleProps = {
  role: "user" | "assistant";
  lines: string[];
  decorated?: boolean;
  icon?: SkinTypeIcon;
  selectionSummary?: boolean;
  /** 텍스트가 드러나기 시작하는 시각(epoch ms). 없으면 마운트 즉시. */
  revealAt?: number;
};

function Avatar() {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: "var(--avatar-size)",
        height: "var(--avatar-size)",
        background: "var(--bubble-fill)",
        border: "1px solid var(--bubble-stroke)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-[16px] leading-none text-white"
        style={{ textShadow: "var(--sparkle-glow)" }}
      >
        ✦
      </span>

      <Star size={2} style={{ left: 4, top: 5 }} />
      <Star size={2} style={{ left: 26, top: 28 }} />
    </div>
  );
}

export default function ChatBubble({
  role,
  lines,
  decorated = false,
  icon,
  selectionSummary = false,
  revealAt,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const reduced = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
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

  if (!started) {
    return null;
  }

  return (
    <div
      ref={rowRef}
      className={`smudge-block reveal-scroll flex items-start ${isUser ? "justify-end" : "justify-start"}`}
      style={{ gap: "var(--avatar-bubble-gap)" }}
    >
      {isUser ? null : <Avatar />}

      <div
        className="relative min-w-0"
        style={{
          background: isUser ? "var(--bubble-fill)" : undefined,
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
        {isUser ? null : <AssistantBubbleShape />}

        <div className={icon ? "relative flex items-center gap-2" : "relative"}>
          <div
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
            <Star
              size={4}
              style={{ left: "100%", top: "37%" }}
              rays={{ x: 12, y: 12 }}
            />
            <Star
              size={3}
              style={{ left: "0%", top: "74%" }}
              rays={{ x: 9, y: 9 }}
            />
            <Star size={2} style={{ left: "61%", top: "82%" }} maxOpacity={0.7} />
            <BorderGlint />
          </>
        ) : null}
      </div>

    </div>
  );
}
