"use client";

import Image from "next/image";
import { Star, Twinkle } from "./Sparkle";

export default function AssistantAvatar({ ringAccents = false }: { ringAccents?: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-testid="assistant-avatar"
      className="relative shrink-0 rounded-full"
      style={{
        width: "var(--avatar-size)",
        height: "var(--avatar-size)",
        background: "var(--bubble-fill)",
        border: "1px solid var(--bubble-stroke)",
      }}
    >
      <Twinkle
        centered
        minOpacity={0.9}
        className="absolute overflow-visible"
        // 원본은 32:44 비율. 높이는 유지하고 가로만 두 배로 늘린다.
        style={{ left: "50%", top: "50%", width: 70.4, height: 48.4 }}
      >
        <Image
          src="/images/chat/greeting-star.png"
          alt=""
          fill
          unoptimized
          sizes="71px"
          draggable={false}
          style={{ objectFit: "fill" }}
        />
      </Twinkle>

      {ringAccents ? (
        <>
          <Star size={2} style={{ left: 4, top: 5 }} />
          <Star size={2} style={{ left: 26, top: 28 }} />
        </>
      ) : null}
    </div>
  );
}
