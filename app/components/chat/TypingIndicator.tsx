"use client";

// [Web 전용] AI가 답을 만드는 동안 AI 말풍선 자리에 뜨는 점 세 개. 말풍선 토큰을 그대로 빌린다.
import { ko } from "@/app/lib/locale/ko";

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
          background: "var(--bubble-fill)",
          border: "1px solid var(--bubble-stroke)",
          borderRadius: "var(--bubble-radius)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute -left-[3.5px] top-2 h-[7px] w-[7px] rotate-45 rounded-[1px]"
          style={{
            background: "var(--bubble-fill)",
            borderLeft: "1px solid var(--bubble-stroke)",
            borderBottom: "1px solid var(--bubble-stroke)",
          }}
        />
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="typing-dot"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
