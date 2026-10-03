"use client";

import StarLight from "./StarLight";
import { useSparkleLoop, useTwinkle } from "./Sparkle";

type BubbleBorderSparkleProps = {
  side: "left" | "right";
};

/** 테두리 위에 중심을 놓는 네 갈래 빛. 공유 별빛 리듬으로 외부 광채가 퍼진다. */
export default function BubbleBorderSparkle({ side }: BubbleBorderSparkleProps) {
  const isRight = side === "right";
  const { animate } = useSparkleLoop();
  const lit = useTwinkle(animate, isRight ? 450 : 0);

  return (
    <StarLight
      lit={lit}
      animate={animate}
      data-testid="greeting-border-star"
      data-side={side}
      className="pointer-events-none absolute overflow-visible"
      style={{
        left: isRight ? "calc(100% + 0.5px)" : -0.5,
        top: isRight ? "calc(80% - 30px)" : "74%",
        width: isRight ? 45 : 32,
        height: isRight ? 61.875 : 44,
        transform: `translate(-50%, -50%) scale(${lit ? 1.15 : 1})`,
        transition: animate ? "transform 600ms ease-in-out" : undefined,
      }}
    />
  );
}
