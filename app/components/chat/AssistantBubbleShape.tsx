"use client";

import { useLayoutEffect, useRef } from "react";

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
export default function AssistantBubbleShape() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

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
      <path
        ref={pathRef}
        fill="var(--bubble-fill)"
        stroke="var(--bubble-stroke)"
        strokeWidth={1}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
