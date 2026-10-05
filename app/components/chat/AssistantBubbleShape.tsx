"use client";

import { useId, useLayoutEffect, useRef } from "react";

type AssistantBubbleShapeProps = {
  champagne?: boolean;
  innerShadowOpacity?: number;
  innerRange?: number;
};

const volumeInsetOffset = 3;

function bubbleOutline(width: number, height: number, radius: number) {
  const edge = 0.5;
  const right = width - edge;
  const bottom = height - edge;
  const r = Math.min(radius - edge, (width - 1) / 2, (height - 1) / 2);
  const curve = r * 0.55228475;

  // 본체와 꼬리를 한 번에 감싼다. 왼쪽 위 곡선은 크기와 무관한 CSS px 좌표다.
  return [
    `M 22 ${edge}`,
    `H ${right - r}`,
    `C ${right - r + curve} ${edge} ${right} ${edge + r - curve} ${right} ${edge + r}`,
    `V ${bottom - r}`,
    `C ${right} ${bottom - r + curve} ${right - r + curve} ${bottom} ${right - r} ${bottom}`,
    `H ${edge + r}`,
    `C ${edge + r - curve} ${bottom} ${edge} ${bottom - r + curve} ${edge} ${bottom - r}`,
    "V 24",
    "C 0.5 16 -1 12 -8 9",
    "C 10 12 11 0.5 22 0.5",
    "Z",
  ].join(" ");
}

/** 투명한 1px 레이아웃 테두리를 가진 말풍선의 유리 면과 외곽선. */
export default function AssistantBubbleShape({ champagne = false, innerShadowOpacity = 0.05, innerRange = 1 }: AssistantBubbleShapeProps) {
  const edgeColor = champagne ? "rgba(231,184,130,0.35)" : "var(--bubble-stroke)";
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const innerLightId = `bubble-inner-light-${useId()}`;
  const volumeId = `bubble-volume-${useId()}`;

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const bubble = svg?.parentElement;
    if (!svg || !path || !bubble) return;

    function draw() {
      if (!svg || !path || !bubble) return;
      const { width, height } = bubble.getBoundingClientRect();
      if (width <= 1 || height <= 1) return;
      const radius = parseFloat(getComputedStyle(bubble).borderTopLeftRadius);
      // viewBox와 실제 크기를 맞춰 꼬리와 곡률이 늘어나지 않도록 한다.
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      path.setAttribute("d", bubbleOutline(width, height, radius));
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(bubble, { box: "border-box" });
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      data-bubble-shape="assistant"
      className="pointer-events-none absolute overflow-visible"
      // absolute 배치의 기준인 padding-box에서 투명 테두리까지 확장한다.
      style={{ left: -1, top: -1, width: "calc(100% + 2px)", height: "calc(100% + 2px)" }}
    >
      <defs>
          <linearGradient id={volumeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(211 147 104 / 0.15)" />
            <stop offset="0.3" stopColor="var(--bubble-fill)" />
            <stop offset="0.7" stopColor="var(--bubble-fill)" />
            <stop offset="1" stopColor="rgb(211 147 104 / 0.15)" />
          </linearGradient>
          <filter
            id={innerLightId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            {/* 면의 15% 알파를 복원해 곡선형 꼬리까지 같은 윤곽 안에서 빛과 음영을 만든다. */}
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6.666667 0"
              result="solidShape"
            />
            <feGaussianBlur in="solidShape" stdDeviation={4 * innerRange} result="softInnerEdge" />
            <feComposite
              in="solidShape"
              in2="softInnerEdge"
              operator="out"
              result="innerEdge"
            />
            {/* 외곽선 색을 공유하고 블러 마스크로 안쪽을 향해 부드럽게 투명해진다. */}
            <feFlood floodColor={edgeColor} floodOpacity={0.65} result="goldLight" />
            <feComposite in="goldLight" in2="innerEdge" operator="in" result="innerLight" />
            <feGaussianBlur in="solidShape" stdDeviation={5 * innerRange} result="softShadeEdge" />
            <feOffset in="softShadeEdge" dx={0} dy={-volumeInsetOffset} result="raisedShadeEdge" />
            <feComposite
              in="solidShape"
              in2="raisedShadeEdge"
              operator="out"
              result="bottomEdge"
            />
            <feFlood floodColor={edgeColor} floodOpacity={innerShadowOpacity * 6} result="warmShade" />
            <feComposite in="warmShade" in2="bottomEdge" operator="in" result="bottomShade" />
            <feOffset in="softShadeEdge" dx={0} dy={volumeInsetOffset} result="lowerShadeEdge" />
            <feComposite in="solidShape" in2="lowerShadeEdge" operator="out" result="topEdge" />
            <feComposite in="warmShade" in2="topEdge" operator="in" result="topShade" />
            <feGaussianBlur in="solidShape" stdDeviation={4} result="liftBlur" />
            <feOffset in="liftBlur" dx={0} dy={3} result="liftedMask" />
            <feComposite in="liftedMask" in2="solidShape" operator="out" result="outerLift" />
            <feFlood floodColor="rgb(88 48 26)" floodOpacity={0.05} result="liftColor" />
            <feComposite in="liftColor" in2="outerLift" operator="in" result="softLift" />
            <feMerge>
              <feMergeNode in="softLift" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="bottomShade" />
              <feMergeNode in="innerLight" />
              <feMergeNode in="topShade" />
            </feMerge>
          </filter>
      </defs>
      <path
        ref={pathRef}
        fill={`url(#${volumeId})`}
        stroke={edgeColor}
        strokeWidth={1}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        filter={`url(#${innerLightId})`}
      />
    </svg>
  );
}
