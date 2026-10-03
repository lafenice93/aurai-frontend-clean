"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { WORD_MS } from "@/app/lib/reveal";

type AlternatingAssistantTextProps = {
  lines: string[];
  reduced: boolean;
};

function visualLines(element: HTMLElement) {
  const rows: { top: number; text: string }[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const text = node.textContent ?? "";
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === "\n") continue;

      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      if (rect.height === 0) continue;

      const row = rows.find((item) => Math.abs(item.top - rect.top) < 1);
      if (row) row.text += character;
      else rows.push({ top: rect.top, text: character });
    }
    node = walker.nextNode();
  }

  return rows.map((row) => row.text.trimEnd());
}

function AnimatedText({ text, reduced, wordOffset }: { text: string; reduced: boolean; wordOffset: number }) {
  if (reduced) return text;

  let wordIndex = wordOffset;
  return text.split(/(\s+)/).map((part, index) => {
    if (/^\s+$/.test(part)) return part;
    const delay = wordIndex;
    wordIndex += 1;
    return (
      <span key={`${part}-${index}`} className="smudge-word" style={{ animationDelay: `${delay * WORD_MS}ms` }}>
        {part}
      </span>
    );
  });
}

/** 브라우저가 실제로 감싼 줄을 측정해 짝수 줄만 살짝 들여쓴 AI 본문. */
export default function AlternatingAssistantText({ lines, reduced }: AlternatingAssistantTextProps) {
  const source = lines.join("\n");
  const textRef = useRef<HTMLParagraphElement>(null);
  const [wrapped, setWrapped] = useState<string[] | null>(null);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const element: HTMLParagraphElement = text;

    function measure() {
      const next = visualLines(element);
      if (next.length === 0) return;
      setWrapped((current) => {
        const matches = current?.length === next.length && current.every((line, index) => line === next[index]);
        return matches ? current : next;
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [source]);

  let wordOffset = 0;
  return (
    <p
      ref={textRef}
      className="text-[15px] leading-[1.4]"
      style={{
        color: "var(--text-primary)",
        wordBreak: "keep-all",
        whiteSpace: "pre-line",
        overflowWrap: "anywhere",
        visibility: wrapped ? undefined : "hidden",
      }}
    >
      {wrapped
        ? wrapped.map((text, index) => {
            const offset = wordOffset;
            wordOffset += text.trim().split(/\s+/).filter(Boolean).length;
            return (
              <span
                key={`${index}-${text}`}
                data-testid="assistant-visual-line"
                className="block w-full"
                style={{ boxSizing: "border-box", paddingInlineStart: index % 2 === 1 ? "0.15em" : undefined }}
              >
                <AnimatedText text={text} reduced={reduced} wordOffset={offset} />
              </span>
            );
          })
        : source}
    </p>
  );
}
