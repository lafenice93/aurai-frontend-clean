import type { CSSProperties, ReactNode } from "react";

// 온보딩 아트보드 크기. 오버레이는 이 프레임의 %좌표로 그림 위에 고정된다.
export const ARTBOARD = { width: 941, height: 1672 };

// 무대는 가로에 맞추고(잘림 없음) 세로는 뷰포트를 넘지 않는다. 남는 위아래는 브론즈 배경.
export default function Stage({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: `${ARTBOARD.width} / ${ARTBOARD.height}`,
          width: `min(100%, calc(100dvh * ${ARTBOARD.width} / ${ARTBOARD.height}))`,
        }}
      >
        {children}
      </div>
    </main>
  );
}

type HitProps = {
  top: number;
  left: number;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

// 그림 속 컨트롤 위에 얹는 실제 컨트롤의 자리. 단위는 아트보드 %.
export function Hit({ top, left, width, height, className, style, children }: HitProps) {
  return (
    <div
      className={`absolute ${className ?? ""}`}
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        height: `${height}%`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// 그림 속 컨트롤을 가리기 위한 불투명 글라스. 원본 디자인과 같은 계열 색.
export const glass: CSSProperties = {
  background: "rgb(148 104 72 / 0.97)",
  border: "1px solid rgb(245 176 121 / 0.45)",
  color: "var(--ui-ivory)",
};

export const glassGlow: CSSProperties = {
  ...glass,
  background:
    "linear-gradient(180deg, rgb(232 185 138 / 0.97), rgb(196 140 96 / 0.97))",
  boxShadow: "0 0 18px rgb(232 185 138 / 0.55)",
  color: "#3B2418",
};
