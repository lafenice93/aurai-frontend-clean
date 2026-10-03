"use client";

import { useEffect, useRef, useState } from "react";
import Appear from "@/app/components/chat/Appear";
import { Star, useReducedMotion } from "@/app/components/chat/Sparkle";
import {
  BUBBLE_GAP_MS,
  NUDGE_MS,
  NUDGE_REPEAT_GAP_MS,
  WORD_MS,
  nudgeStartAfter,
} from "@/app/lib/reveal";

// 탭 순간 금빛 외곽선이 띠용 하는 시간 (.chip-pop 애니메이션 길이와 맞출 것)
const CHIP_POP_MS = 700;

type QuickPromptsProps = {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
};

// 칩은 제 차례(index × 2초)에 칩과 글자가 함께 등장한다. 글자는 단어 단위로 스머징.
function Chip({
  prompt,
  index,
  lit,
  popping,
  onSelect,
}: {
  prompt: string;
  index: number;
  lit: boolean;
  popping: boolean;
  onSelect: (prompt: string) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <Appear as="li" after={index * BUBBLE_GAP_MS}>
      <button
        type="button"
        onClick={() => onSelect(prompt)}
        className={`relative cursor-pointer rounded-[12px] px-4 py-2.5 text-sm font-normal transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] ${
          popping ? "chip-pop" : lit ? "chip-nudge" : ""
        }`}
        style={{
          background: "var(--bubble-fill)",
          border: "1px solid var(--bubble-stroke)",
          color: "var(--text-primary)",
        }}
      >
        {reduced
          ? prompt
          : prompt.split(" ").map((word, wordIndex, words) => (
              <span key={wordIndex}>
                <span
                  className="smudge-word"
                  style={{ animationDelay: `${wordIndex * WORD_MS}ms` }}
                >
                  {word}
                </span>
                {wordIndex < words.length - 1 ? " " : null}
              </span>
            ))}
        <Star
          size={2}
          style={{ left: "0%", top: "66%" }}
          rays={{ x: 4, y: 8 }}
          glowScale={0.7}
          startDelay={index * 1200}
        />
        {/* 금빛 빛 선이 켜진 동안 테두리 위에 얹히는 반짝이 */}
        {lit || popping ? (
          <>
            <Star
              size={3}
              style={{ left: "12%", top: "0%" }}
              rays={{ x: 8, y: 8 }}
              glowScale={0.9}
            />
            <Star
              size={3}
              style={{ left: "100%", top: "35%" }}
              rays={{ x: 8, y: 8 }}
              glowScale={0.9}
              startDelay={400}
            />
          </>
        ) : null}
      </button>
    </Appear>
  );
}

// TODO: radius·padding 확정, 색 토큰은 임시 (말풍선 토큰을 그대로 빌려 쓰는 중).
export default function QuickPrompts({ prompts, onSelect }: QuickPromptsProps) {
  const reduced = useReducedMotion();
  // 칩이 다 나타난 뒤 첫 칩부터 차례로 3초씩 신호를 보낸다. 탭하거나 화면을 떠나면 멈춘다.
  const [nudge, setNudge] = useState<number | null>(null);
  const [popping, setPopping] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (reduced) {
      return;
    }

    // 한 바퀴: 첫 칩부터 차례로 NUDGE_MS씩. 끝나면 NUDGE_REPEAT_GAP_MS 쉬고 다시 한 바퀴.
    const arm = (startAt: number) => {
      prompts.forEach((_, index) =>
        timers.current.push(
          setTimeout(() => setNudge(index), startAt + index * NUDGE_MS),
        ),
      );
      timers.current.push(
        setTimeout(() => {
          setNudge(null);
          arm(NUDGE_REPEAT_GAP_MS);
        }, startAt + prompts.length * NUDGE_MS),
      );
    };

    arm(nudgeStartAfter(prompts.length, BUBBLE_GAP_MS));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [prompts, reduced]);

  // 탭 → 신호 중단 → 금빛 외곽선 띠용 → 그 뒤에 다음 단계로.
  function handleSelect(prompt: string) {
    if (popping) {
      return;
    }

    timers.current.forEach(clearTimeout);
    setNudge(null);

    if (reduced) {
      onSelect(prompt);
      return;
    }

    setPopping(prompt);
    timers.current = [
      setTimeout(() => {
        setPopping(null);
        onSelect(prompt);
      }, CHIP_POP_MS),
    ];
  }

  return (
    <ul
      className="flex flex-wrap gap-2"
      style={{
        marginTop: "12px",
        paddingLeft: "calc(var(--avatar-size) + var(--avatar-bubble-gap))",
      }}
    >
      {prompts.map((prompt, index) => (
        <Chip
          key={prompt}
          prompt={prompt}
          index={index}
          lit={nudge === index}
          popping={popping === prompt}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );
}
