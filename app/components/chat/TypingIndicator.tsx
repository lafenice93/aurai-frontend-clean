"use client";

// [Web 전용] AI가 답을 만드는 동안 AI 말풍선 자리에 뜨는 점 세 개. 말풍선 토큰을 그대로 빌린다.
import { ko } from "@/app/lib/locale/ko";
import AssistantBubbleShape from "./AssistantBubbleShape";

export default function TypingIndicator() {
  return (
    <div
      className="flex items-start justify-start"
      style={{ gap: "var(--avatar-bubble-gap)" }}
      role="status"
      aria-label={ko.AI_THINKING}
      data-testid="typing-indicator"
    >
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
      </div>

      <div
        className="relative flex items-center"
        style={{
          gap: 5,
          padding: "16px 18px",
          border: "1px solid transparent",
          borderRadius: "var(--bubble-radius)",
        }}
      >
        <AssistantBubbleShape />
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="typing-dot relative"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
