"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ko } from "@/app/lib/locale/ko";
import {
  CARD_GAP_MS,
  NUDGE_MS,
  NUDGE_REPEAT_GAP_MS,
  nudgeStartAfter,
} from "@/app/lib/reveal";
import type { SkinTypeIcon } from "@/app/lib/skinTypes";
import Appear from "./Appear";
import { SkinIcon } from "./icons";
import { Star, useReducedMotion } from "./Sparkle";

// .skin-card-pop 애니메이션 길이와 맞춰야 한다.
const POP_MS = 520;

export type ChoiceItem = {
  id: string;
  label: string;
  lines: string[];
  photo: string;
  icon?: SkinTypeIcon;
  /** 썸네일이 원본 가로를 잘라내므로, 핵심 부위가 잘리는 사진만 지정한다. */
  focus?: string;
};

type ChoiceCardsProps = {
  items: ChoiceItem[];
  selected: string | null;
  onSelect: (id: string) => void;
  onUnsure: () => void;
  testId: string;
  itemLabel: (label: string) => string;
  imageVariant?: "skin-type" | "default";
};

export default function ChoiceCards({
  items,
  selected,
  onSelect,
  onUnsure,
  testId,
  itemLabel,
  imageVariant = "default",
}: ChoiceCardsProps) {
  // 이미지 표현은 목록 전체가 공유한다. 개별 카드의 아이콘 유무로 바꾸지 않는다.
  const isSkinType = imageVariant === "skin-type";
  // 사진 끝의 투명도도 완만하게 바꿔 그라데이션과 만나는 경계를 흐린다.
  const imageMask = isSkinType
    ? [
        "linear-gradient(90deg, #000 0%, #000 66.667%,",
        "rgb(0 0 0 / 0.962) 70.833%, rgb(0 0 0 / 0.854) 75%,",
        "rgb(0 0 0 / 0.691) 79.167%, rgb(0 0 0 / 0.5) 83.333%,",
        "rgb(0 0 0 / 0.309) 87.5%, rgb(0 0 0 / 0.146) 91.667%,",
        "rgb(0 0 0 / 0.038) 95.833%, transparent 100%)",
      ].join(" ")
    : undefined;
  const gradientStyle = {
    width: isSkinType ? "calc(100% / 3 + 40px)" : "50%",
    right: isSkinType ? -16 : 0,
    background: isSkinType
      ? [
          "linear-gradient(90deg,",
          "rgb(174 126 91 / 0) 0%, rgb(174 126 91 / 0.012) 12.5%,",
          "rgb(174 126 91 / 0.09) 25%, rgb(164 117 84 / 0.23) 37.5%,",
          "rgb(154 108 76 / 0.32) 50%,",
          "rgb(144 99 68 / 0.23) 62.5%, rgb(134 90 61 / 0.09) 75%,",
          "rgb(134 90 61 / 0.012) 87.5%, rgb(134 90 61 / 0) 100%)",
        ].join(" ")
      : "linear-gradient(90deg, #AE7E5B 0%, #865A3D 100%)",
  };
  const reduced = useReducedMotion();
  const [popping, setPopping] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // 카드가 다 나타난 뒤 첫 카드부터 차례로 NUDGE_MS씩 금빛 신호를 보낸다. 탭하거나 고르면 멈춘다.
  const [nudge, setNudge] = useState<number | null>(null);
  const nudgeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (reduced || selected !== null) {
      return;
    }

    // 한 바퀴: 첫 카드부터 차례로 NUDGE_MS씩. 끝나면 NUDGE_REPEAT_GAP_MS 쉬고 다시 한 바퀴.
    const arm = (startAt: number) => {
      items.forEach((_, index) =>
        nudgeTimers.current.push(
          setTimeout(() => setNudge(index), startAt + index * NUDGE_MS),
        ),
      );
      nudgeTimers.current.push(
        setTimeout(() => {
          setNudge(null);
          arm(NUDGE_REPEAT_GAP_MS);
        }, startAt + items.length * NUDGE_MS),
      );
    };

    arm(nudgeStartAfter(items.length, CARD_GAP_MS));

    return () => {
      nudgeTimers.current.forEach(clearTimeout);
      nudgeTimers.current = [];
    };
  }, [items, reduced, selected]);

  function handleTap(id: string) {
    if (popping) {
      return;
    }

    nudgeTimers.current.forEach(clearTimeout);
    nudgeTimers.current = [];
    setNudge(null);
    setPopping(id);
    timer.current = setTimeout(
      () => {
        onSelect(id);
        setPopping(null);
      },
      reduced ? 0 : POP_MS,
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const isPopping = popping === item.id;
          const isActive = selected === item.id || isPopping;
          const isLit = nudge === index && !popping && selected === null;

          return (
            <Appear
              key={item.id}
              as="li"
              className="relative"
              after={index * CARD_GAP_MS}
            >
              <button
                type="button"
                data-testid={testId}
                data-type={item.id}
                aria-label={itemLabel(item.label)}
                aria-pressed={isActive}
                onClick={() => handleTap(item.id)}
                // 하나를 고르면 목록을 잠근다. 다시 고르면 다음 단계가 통째로 한 번 더 붙기 때문.
                disabled={selected !== null}
                style={{
                  background: "var(--bubble-fill)",
                  border: `1.3px solid ${
                    isActive ? "var(--gold-line)" : "var(--bubble-stroke)"
                  }`,
                  boxShadow:
                    isActive && !isPopping ? "var(--gold-glow)" : undefined,
                }}
                className={`flex w-full cursor-pointer items-stretch gap-4 overflow-hidden rounded-[18px] pr-4 text-left transition-transform duration-200 ease-in-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-default disabled:hover:translate-y-0 ${
                  isPopping
                    ? "skin-card-pop"
                    : isLit
                      ? "card-nudge"
                      : "active:scale-[0.99]"
                } ${selected !== null && !isActive ? "opacity-60" : ""}`}
              >
                <div className="relative w-[140px] shrink-0 self-stretch">
                  <Image
                    src={item.photo}
                    alt={`${item.label} 예시 이미지`}
                    fill
                    sizes="140px"
                    className="object-cover"
                    style={{
                      objectPosition: item.focus ?? "center",
                      maskImage: imageMask,
                      WebkitMaskImage: imageMask,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0"
                    style={gradientStyle}
                  />
                </div>

                <div className="flex flex-1 items-center gap-3 py-2.5 pr-1">
                  {item.icon ? (
                    <SkinIcon
                      name={item.icon}
                      className="shrink-0 text-[#F0DCC6]/85"
                      size={30}
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-tight">{item.label}</p>
                    {item.lines.map((line) => (
                      <p
                        key={line}
                        className="mt-0.5 text-[11px] leading-[1.35] text-[#F7EEE6]/70"
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  <span
                    aria-hidden="true"
                    style={{
                      borderColor: isActive
                        ? "var(--accent)"
                        : "var(--bubble-stroke)",
                      background: isActive ? "var(--accent)" : "transparent",
                    }}
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center self-center rounded-full border"
                  >
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5A3A22]" />
                    ) : null}
                  </span>
                </div>
              </button>

              {/* 금빛 빛 선이 켜진 동안(신호·선택) 테두리 위에 얹히는 반짝이 */}
              {isActive || isLit ? (
                <>
                  <Star
                    size={3}
                    style={{ left: "0%", top: "30%" }}
                    rays={{ x: 9, y: 9 }}
                  />
                  <Star
                    size={4}
                    style={{ left: "100%", top: "70%" }}
                    rays={{ x: 12, y: 12 }}
                    startDelay={400}
                  />
                </>
              ) : null}
            </Appear>
          );
        })}
      </ul>

      <Appear after={items.length * CARD_GAP_MS}>
        <button
          type="button"
          onClick={onUnsure}
          className="mx-auto block cursor-pointer text-[13px] text-[#F7EEE6]/70 underline underline-offset-4 transition-opacity duration-200 ease-in-out hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]"
        >
          {ko.SKIN_TYPE_UNSURE}
        </button>
      </Appear>
    </div>
  );
}
