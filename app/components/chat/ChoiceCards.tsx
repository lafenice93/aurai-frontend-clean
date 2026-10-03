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
import { BorderGlint, Star, useReducedMotion } from "./Sparkle";

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
  selected: string | null | readonly string[];
  onSelect: (id: string) => void;
  onUnsure?: () => void;
  testId: string;
  itemLabel: (label: string) => string;
  imageVariant?: "skin-type" | "default";
  /** 왼쪽 시작점을 유지하며 그라데이션을 오른쪽으로만 늘릴 폭(px). */
  gradientRightExtension?: number;
  /** 기존 높이에 더할 값(px). 위아래 여백에 절반씩 추가한다. */
  cardHeightIncrease?: number;
  /** 그라데이션 박스를 오른쪽으로 이동할 값(px). */
  gradientRightShift?: number;
  /** 카드 안의 제목·설명 텍스트만 오른쪽으로 이동할 값(px). */
  textRightShift?: number;
  /** 고민 카드는 선택 이후에도 다른 카드를 바로 고를 수 있다. */
  allowReselect?: boolean;
  /** 부위 선택을 마친 목록은 선택 상태를 유지한 채 잠근다. */
  disabled?: boolean;
  itemDataAttribute?: "data-type" | "data-area";
  /** 기존 피부 고민 결과 카드가 사용하던 이미지 오른쪽 페이드 마스크. */
  legacyImageFade?: boolean;
  /** 레이아웃 너비를 유지하며 사진만 오른쪽으로 확장한다(px). */
  imageRightExtension?: number;
  /** 사진 오른쪽 끝에서 투명해지는 구간의 너비(px). */
  imageFadeWidth?: number;
  /** 제목과 설명을 함께 기존 위치에서 이동한다(px). */
  textPositionOffset?: number;
  /** 이동한 글자가 선택 버튼을 덮지 않도록 같은 폭의 여백을 확보한다. */
  reserveTextOffset?: boolean;
  /** 피부타입 카드의 텍스트와 일러스트를 함께 이동한다(px). */
  contentRightShift?: number;
  /** 피부타입 카드와 같은 기본 이미지 마스크를 사용한다. */
  useDefaultImageMask?: boolean;
  /** 피부타입 카드의 이미지·그라데이션 수치를 결과 카드에도 적용한다. */
  useSkinTypeImageValues?: boolean;
};

// 최초 고민 목록과 고민별 부위 목록이 같은 카드 양식을 사용한다.
export function ConcernChoiceCards(
  props: Omit<
    ChoiceCardsProps,
    | "imageVariant"
    | "cardHeightIncrease"
    | "gradientRightShift"
    | "textRightShift"
    | "legacyImageFade"
    | "imageRightExtension"
    | "imageFadeWidth"
  >,
) {
  return (
    <ChoiceCards
      {...props}
      imageVariant="skin-type"
      cardHeightIncrease={20}
      gradientRightExtension={props.useSkinTypeImageValues ? 40 : 0}
      gradientRightShift={10}
      textRightShift={40}
      legacyImageFade={props.useSkinTypeImageValues || props.useDefaultImageMask ? false : true}
      imageRightExtension={props.useSkinTypeImageValues ? 59 : 76}
      imageFadeWidth={props.useSkinTypeImageValues || props.useDefaultImageMask ? undefined : 50}
    />
  );
}

export default function ChoiceCards({
  items,
  selected,
  onSelect,
  onUnsure,
  testId,
  itemLabel,
  imageVariant = "default",
  gradientRightExtension = 0,
  cardHeightIncrease = 0,
  gradientRightShift = 0,
  textRightShift = 0,
  allowReselect = false,
  disabled = false,
  itemDataAttribute = "data-type",
  legacyImageFade = false,
  imageRightExtension = 0,
  imageFadeWidth,
  textPositionOffset = 0,
  reserveTextOffset = false,
  contentRightShift = 0,
}: ChoiceCardsProps) {
  const multiple = typeof selected !== "string" && selected !== null;
  const selectedIds = typeof selected === "string" ? [selected] : selected ?? [];
  const hasSelection = selectedIds.length > 0;
  // 이미지 표현은 목록 전체가 공유한다. 개별 카드의 아이콘 유무로 바꾸지 않는다.
  const isSkinType = imageVariant === "skin-type";
  const textOffset = textRightShift + textPositionOffset + contentRightShift;
  const fadePosition = (percent: number) => imageFadeWidth === undefined
    ? `${percent}%`
    : `calc(100% - ${((100 - percent) / 40) * imageFadeWidth}px)`;
  // 알파 마스크로 사진을 지워 반투명 카드 배경 자체가 드러나게 한다.
  // 알파 모드에서는 마스크 색을 칠하지 않고 투명도만 적용한다.
  const fadeColor = (alpha: number) => imageFadeWidth === undefined
    ? `rgb(0 0 0 / ${alpha})`
    : `rgb(255 255 255 / ${alpha})`;
  // 사진 끝의 투명도도 완만하게 바꿔 그라데이션과 만나는 경계를 흐린다.
  const imageMask = isSkinType
    ? legacyImageFade
      ? [
          `linear-gradient(90deg, ${fadeColor(1)} 0%, ${fadeColor(1)} ${fadePosition(60)},`,
          `${fadeColor(0.96)} ${fadePosition(65)}, ${fadeColor(0.84)} ${fadePosition(70)},`,
          `${fadeColor(0.68)} ${fadePosition(75)}, ${fadeColor(0.5)} ${fadePosition(80)},`,
          `${fadeColor(0.32)} ${fadePosition(85)}, ${fadeColor(0.16)} ${fadePosition(90)},`,
          `${fadeColor(0.04)} ${fadePosition(95)}, ${fadeColor(0)} 100%)`,
        ].join(" ")
      : [
        "linear-gradient(90deg, #000 0%, #000 54%,",
        "rgb(0 0 0 / 0.96) 60%, rgb(0 0 0 / 0.82) 68%,",
        "rgb(0 0 0 / 0.62) 76%, rgb(0 0 0 / 0.34) 84%,",
        "rgb(0 0 0 / 0.12) 92%, transparent 100%)",
      ].join(" ")
    : undefined;
  const gradientStyle = {
    // 왼쪽은 선명하게 유지하고, 오른쪽으로 갈수록 섬세하게 배경색과 섞이도록 자연스러운 웜 톤 그라데이션을 적용한다.
    width: isSkinType
      ? `calc(100% / 3 + ${100 + gradientRightExtension}px)`
      : "50%",
    right: isSkinType
      ? -55 - gradientRightExtension - gradientRightShift
      : 0,
    background: isSkinType
      ? [
          "linear-gradient(90deg,",
          "rgb(123 77 53 / 0) 0%, rgb(123 77 53 / 0.04) 18%,",
          "rgb(123 77 53 / 0.11) 38%, rgb(123 77 53 / 0.18) 52%,",
          "rgb(123 77 53 / 0.11) 68%, rgb(123 77 53 / 0.04) 84%,",
          "rgb(123 77 53 / 0) 100%)",
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
    if (reduced || hasSelection || disabled) {
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
      setNudge(null);
    };
  }, [items, reduced, hasSelection, disabled]);

  function handleTap(id: string) {
    if (
      disabled ||
      (!multiple && ((!allowReselect && popping) || (allowReselect && selected === id)))
    ) {
      return;
    }

    clearTimeout(timer.current);
    nudgeTimers.current.forEach(clearTimeout);
    nudgeTimers.current = [];
    setNudge(null);
    setPopping(multiple && selectedIds.includes(id) ? null : id);
    if (multiple || allowReselect) onSelect(id);
    timer.current = setTimeout(
      () => {
        if (!multiple && !allowReselect) onSelect(id);
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
          const isActive = selectedIds.includes(item.id) || (!multiple && isPopping);
          const isLit = nudge === index && !popping && !hasSelection && !disabled;

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
                {...{ [itemDataAttribute]: item.id }}
                aria-label={itemLabel(item.label)}
                aria-pressed={isActive}
                onClick={() => handleTap(item.id)}
                // 단일 선택 잠금과 부위 목록의 복수 선택을 같은 카드에서 처리한다.
                disabled={disabled || (!multiple && hasSelection && !allowReselect)}
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
                } ${!multiple && hasSelection && !isActive ? "opacity-60" : ""}`}
              >
                <div className="relative w-[140px] shrink-0 self-stretch">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: imageRightExtension ? `calc(100% + ${imageRightExtension}px)` : "100%" }}
                  >
                    <Image
                      src={item.photo}
                      alt={`${item.label} 예시 이미지`}
                      fill
                      sizes={`${140 + imageRightExtension}px`}
                      className="object-cover"
                      style={{
                        objectPosition: item.focus ?? "center",
                        filter: isSkinType ? "saturate(1.08) contrast(1.05)" : undefined,
                        maskImage: imageMask,
                        WebkitMaskImage: imageMask,
                        maskMode: imageFadeWidth === undefined ? undefined : "alpha",
                      }}
                    />
                  </div>
                  {!legacyImageFade ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0"
                      style={gradientStyle}
                    />
                  ) : null}
                </div>

                <div
                  className="flex flex-1 items-center gap-3 py-2.5 pr-1"
                  style={
                    cardHeightIncrease === 0
                      ? undefined
                      : {
                          paddingBlock: `calc(var(--spacing) * 2.5 + ${cardHeightIncrease / 2}px)`,
                        }
                  }
                >
                  {item.icon ? (
                    <span
                      className="shrink-0"
                      style={
                        contentRightShift === 0
                          ? undefined
                          : { transform: `translateX(${contentRightShift}px)` }
                      }
                    >
                      <SkinIcon
                        name={item.icon}
                        className="text-[#F0DCC6]/85"
                        size={30}
                      />
                    </span>
                  ) : null}

                  <div
                    className="min-w-0 flex-1"
                    style={
                      textOffset === 0
                        ? undefined
                        : {
                            transform: `translateX(${textOffset}px)`,
                            // 확장된 결과 사진 옆의 글자가 오른쪽 선택 버튼을 덮지 않게 한다.
                            marginRight: reserveTextOffset ? textOffset : undefined,
                          }
                    }
                  >
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
                  <BorderGlint />
                </>
              ) : null}
            </Appear>
          );
        })}
      </ul>

      {onUnsure ? (
        <Appear after={items.length * CARD_GAP_MS}>
          <button
            type="button"
            onClick={onUnsure}
            className="mx-auto block cursor-pointer text-[13px] text-[#F7EEE6]/70 underline underline-offset-4 transition-opacity duration-200 ease-in-out hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]"
          >
            {ko.SKIN_TYPE_UNSURE}
          </button>
        </Appear>
      ) : null}
    </div>
  );
}
