"use client";

import { useId, type SVGProps } from "react";

type StarLightProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  lit?: boolean;
  animate?: boolean;
  glowScale?: number;
};

const rayPath = "M 0 -8 C 0.45 -2 0.85 -0.6 4 0 C 0.85 0.6 0.45 2 0 8 C -0.45 2 -0.85 0.6 -4 0 C -0.85 -0.6 -0.45 -2 0 -8 Z";

/** 단색 중심점 없이 빛살·하이라이트·광채를 연속 그라데이션으로 겹친 광원. */
export default function StarLight({
  lit = true,
  animate = false,
  glowScale = 1,
  className,
  ...props
}: StarLightProps) {
  const id = useId();
  const haloId = `star-halo-${id}`;
  const rayId = `star-ray-${id}`;
  const highlightId = `star-highlight-${id}`;
  const blurId = `star-bloom-${id}`;
  const edgeId = `star-edge-${id}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-star-light="gradient"
      viewBox="-16 -22 32 44"
      preserveAspectRatio="none"
      width={32}
      height={44}
      className={`pointer-events-none overflow-visible ${className ?? ""}`}
      {...props}
    >
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="#F4D2BB" stopOpacity={0.7 * glowScale} />
          <stop offset="0.2" stopColor="#E49967" stopOpacity={0.34 * glowScale} />
          <stop offset="0.55" stopColor="#E49967" stopOpacity={0.12 * glowScale} />
          <stop offset="1" stopColor="#E49967" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={rayId} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="8" gradientTransform="scale(0.5 1)">
          <stop offset="0" stopColor="#FFF9EF" />
          <stop offset="0.1" stopColor="#FFF0DE" />
          <stop offset="0.3" stopColor="#FFE1C3" />
          <stop offset="0.62" stopColor="#F8C69D" stopOpacity="0.95" />
          <stop offset="1" stopColor="#EAA879" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id={highlightId} gradientUnits="userSpaceOnUse" cx="-0.65" cy="-1" r="5">
          <stop offset="0" stopColor="#FFFCF4" stopOpacity="0.65" />
          <stop offset="0.38" stopColor="#FFF3E1" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFD2AC" stopOpacity="0" />
        </radialGradient>
        <filter id={blurId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id={edgeId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.18" />
        </filter>
      </defs>
      <g
        data-star-halo=""
        opacity={lit ? 1 : 0.8}
        style={{
          transform: `scale(${lit ? 1.25 : 1})`,
          transformBox: "fill-box",
          transformOrigin: "center",
          transition: animate ? "transform 600ms ease-in-out, opacity 600ms ease-in-out" : undefined,
        }}
      >
        <ellipse rx="10" ry="16" fill={`url(#${haloId})`} />
        <path d={rayPath} fill={`url(#${rayId})`} filter={`url(#${blurId})`} opacity={0.8 * glowScale} />
      </g>
      <g filter={`url(#${edgeId})`}>
        <path d={rayPath} fill={`url(#${rayId})`} />
        <path d={rayPath} fill={`url(#${highlightId})`} />
      </g>
    </svg>
  );
}
