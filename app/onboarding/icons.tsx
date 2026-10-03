// [Web 전용] 온보딩 기능 행의 아이콘. 참고 시안의 픽셀을 베끼지 않고 직접 그린다.
// 선 굵기는 DESIGN.md 규칙대로 1.3~1.6 한 가지 계열로 맞춘다.
import type { CSSProperties } from "react";

type IconProps = { size: string };

const base = (size: string): CSSProperties => ({ width: size, height: size });

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 피부 분석: 네 꼭짓점 스캔 프레임 안에 얼굴 */
export function ScanIcon({ size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size)} aria-hidden="true" {...stroke}>
      <path d="M3.4 8.6V5.1a1.7 1.7 0 0 1 1.7-1.7h3.5" />
      <path d="M15.4 3.4h3.5a1.7 1.7 0 0 1 1.7 1.7v3.5" />
      <path d="M20.6 15.4v3.5a1.7 1.7 0 0 1-1.7 1.7h-3.5" />
      <path d="M8.6 20.6H5.1a1.7 1.7 0 0 1-1.7-1.7v-3.5" />
      <path d="M9.4 10.2v1.1" />
      <path d="M14.6 10.2v1.1" />
      <path d="M9.6 14.4a3.1 3.1 0 0 0 4.8 0" />
    </svg>
  );
}

/** 맞춤 케어: 큰 반짝임 하나와 작은 반짝임 둘 */
export function SparkleIcon({ size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size)} aria-hidden="true" {...stroke}>
      <path d="M10 4.2c.9 3.3 1.6 4 4.9 4.9-3.3.9-4 1.6-4.9 4.9-.9-3.3-1.6-4-4.9-4.9 3.3-.9 4-1.6 4.9-4.9Z" />
      <path d="M17.6 13.4c.45 1.65.8 2 2.45 2.45-1.65.45-2 .8-2.45 2.45-.45-1.65-.8-2-2.45-2.45 1.65-.45 2-.8 2.45-2.45Z" />
      <path d="M7.4 16.8c.3 1.1.53 1.33 1.63 1.63-1.1.3-1.33.53-1.63 1.63-.3-1.1-.53-1.33-1.63-1.63 1.1-.3 1.33-.53 1.63-1.63Z" />
    </svg>
  );
}

/** 눈에 보이는 개선: 체크가 든 방패 */
export function ShieldCheckIcon({ size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size)} aria-hidden="true" {...stroke}>
      <path d="M12 2.9l6.7 2.6v5.2c0 4.3-2.7 8.2-6.7 9.4-4-1.2-6.7-5.1-6.7-9.4V5.5L12 2.9Z" />
      <path d="m8.9 11.7 2.2 2.2 4-4.2" />
    </svg>
  );
}
