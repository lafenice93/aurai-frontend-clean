"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";
import { attachmentAt } from "@/app/lib/reveal";
import type { ProductRecognitionResult } from "@/app/lib/schemas/productRecognition";
import type { SkinTypeIcon, SkinTypeId } from "@/app/lib/skinTypes";
import type { ConcernAreaFlowId } from "@/app/lib/concernAreas";
import type { ChatAction } from "./ActionChips";
import ChatBubble from "./ChatBubble";

export type Attachment =
  | { kind: "quick-prompts"; prompts: readonly string[] }
  | { kind: "skin-types" }
  | { kind: "media"; skinTypeId: SkinTypeId }
  | { kind: "concerns" }
  | { kind: "concern-summary"; concernId: ConcernAreaFlowId }
  | { kind: "concern-areas"; concernId: ConcernAreaFlowId }
  | { kind: "recommend"; lines: string[] }
  | { kind: "camera" }
  | { kind: "skin-photo"; context: SkinPhotoContext }
  | { kind: "products"; result: ProductRecognitionResult; photo: Blob | null }
  | { kind: "actions"; actions: ChatAction[] }
  | { kind: "typing" };

export type Message = {
  id: string;
  role: "user" | "assistant";
  lines: string[];
  timestamp: Date | null;
  decorated?: boolean;
  icon?: SkinTypeIcon;
  attachment?: Attachment;
  /** 설문 단계별 카드 블록. 고민을 다시 고르면 이전 부위와 결과를 교체한다. */
  group?: "skin-types" | "concerns" | "concern-areas" | "concern-results";
  /** 텍스트가 드러나기 시작하는 시각(epoch ms). 앞 말풍선이 끝난 뒤로 연쇄 배정된다. 없으면 마운트 즉시. */
  revealAt?: number;
  /** "좋아요, OO님." — 대화에 한 번만 나온다. 이미 있으면 새로 붙이지 않는다. */
  ack?: boolean;
};

type ChatMessagesProps = {
  messages: Message[];
  renderAttachment: (attachment: Attachment) => React.ReactNode;
};

// 첨부물(카드·칩)은 말풍선 텍스트가 다 드러난 뒤에 마운트한다. 숨어 있는 동안 탭되는 일이 없다.
function RevealBlock({
  message,
  animate,
  children,
}: {
  message: Pick<Message, "revealAt" | "lines">;
  /** false면 블록 페이드 없이 바로 그린다 — 자식이 스스로 순차 등장하는 목록(칩·카드)용. */
  animate: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // 시각 계산은 렌더가 아니라 여기서 한다(렌더는 순수해야 한다).
    const now = Date.now();
    const timer = setTimeout(
      () => setShown(true),
      Math.max(0, attachmentAt(message, now) - now),
    );
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (shown) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [shown]);

  return shown ? (
    <div
      ref={ref}
      className={animate ? "smudge-block reveal-scroll" : "reveal-scroll"}
    >
      {children}
    </div>
  ) : null;
}

export default function ChatMessages({
  messages,
  renderAttachment,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <section
      aria-live="polite"
      className="flex-1 space-y-3 overflow-y-auto"
      style={{
        paddingLeft: "var(--gutter)",
        paddingRight: "var(--gutter)",
        // 헤더(safe-area + 8px + 아이콘 13px) 뒤에서 시작하므로, 첫 메시지 행이 safe-area + 71px에 놓인다.
        paddingTop: "50px",
      }}
    >
      {messages.map((message) => (
        <div key={message.id}>
          {message.lines.length > 0 ? (
            <ChatBubble
              role={message.role}
              lines={message.lines}
              decorated={message.decorated}
              icon={message.icon}
              selectionSummary={message.role === "user" && message.group === "concern-areas"}
              revealAt={message.revealAt}
            />
          ) : null}
          {message.attachment ? (
            <RevealBlock
              message={message}
              animate={
                !["quick-prompts", "skin-types", "concerns", "concern-summary", "concern-areas"].includes(
                  message.attachment.kind,
                )
              }
            >
              {renderAttachment(message.attachment)}
            </RevealBlock>
          ) : null}
        </div>
      ))}
      {/* 스크롤 목표이자 하단 입력 바 여백. padding-bottom은 scrollIntoView가 지나쳐 버려 소용없다. */}
      <div
        ref={endRef}
        style={{ height: "calc(env(safe-area-inset-bottom) + 60px)" }}
      />
    </section>
  );
}
