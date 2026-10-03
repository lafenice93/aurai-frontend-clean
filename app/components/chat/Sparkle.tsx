"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import StarLight from "./StarLight";

export const ENABLE_BORDER_GLINT = true;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function usePageVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return visible;
}

export function useSparkleLoop() {
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  return { animate: !reduced && visible, reduced };
}

export function useTwinkle(animate: boolean, startDelay: number) {
  const [lit, setLit] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!animate) {
      return;
    }

    let cancelled = false;

    const schedule = (first: boolean) => {
      timer.current = setTimeout(
        () => {
          if (cancelled) return;
          setLit(true);
          timer.current = setTimeout(() => {
            if (cancelled) return;
            setLit(false);
            schedule(false);
          }, 1200);
        },
        (first ? startDelay : 0) + 1500 + Math.random() * 2500,
      );
    };

    schedule(true);

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      setLit(false);
    };
  }, [animate, startDelay]);

  return lit && animate;
}

/** SVG와 기존 별 아이콘의 모양을 유지하며 같은 별빛 리듬을 적용한다. */
export function Twinkle({
  children,
  className,
  style,
  centered = false,
  maxOpacity = 1,
  minOpacity = 0.65,
  startDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  centered?: boolean;
  maxOpacity?: number;
  minOpacity?: number;
  startDelay?: number;
}) {
  const { animate } = useSparkleLoop();
  const lit = useTwinkle(animate, startDelay);

  return (
    <span
      aria-hidden="true"
      data-star-twinkle=""
      className={className}
      style={{
        ...style,
        pointerEvents: "none",
        transform: `${centered ? "translate(-50%, -50%) " : ""}scale(${lit ? 1.15 : 1})`,
        opacity: maxOpacity * (lit || !animate ? 1 : minOpacity),
        transition: animate ? "transform 600ms ease-in-out, opacity 600ms ease-in-out" : undefined,
      }}
    >
      {children}
    </span>
  );
}

type StarProps = {
  size: number;
  style: CSSProperties;
  rays?: { x: number; y: number };
  maxOpacity?: number;
  glowScale?: number;
  startDelay?: number;
};

export function Star({
  size,
  style,
  rays,
  maxOpacity = 1,
  glowScale = 1,
  startDelay = 0,
}: StarProps) {
  const { animate, reduced } = useSparkleLoop();
  const lit = useTwinkle(animate, startDelay);
  const active = lit || reduced;

  return (
    <StarLight
      lit={active}
      animate={animate}
      glowScale={glowScale}
      style={{
        ...style,
        position: "absolute",
        pointerEvents: "none",
        width: (rays?.x ?? size) * 4,
        height: (rays?.y ?? size * 2) * 2.75,
        transform: `translate(-50%, -50%) scale(${active ? 1.15 : 0.6})`,
        opacity: active ? maxOpacity : maxOpacity * 0.35,
        transition: "transform 600ms ease-in-out, opacity 600ms ease-in-out",
      }}
    />
  );
}

type Glint = { key: number; left: string; top: string; dx: number; dy: number };

function randomEdgeGlint(key: number): Glint {
  const travel = 30 + Math.random() * 10;
  const along = 10 + Math.random() * 60;
  const edge = Math.floor(Math.random() * 4);

  if (edge === 0) return { key, left: `${along}%`, top: "0%", dx: travel, dy: 0 };
  if (edge === 1) return { key, left: "100%", top: `${along}%`, dx: 0, dy: travel };
  if (edge === 2) return { key, left: `${along}%`, top: "100%", dx: -travel, dy: 0 };
  return { key, left: "0%", top: `${along}%`, dx: 0, dy: -travel };
}

export function BorderGlint() {
  const { animate } = useSparkleLoop();
  const [glint, setGlint] = useState<Glint | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!ENABLE_BORDER_GLINT || !animate) {
      return;
    }

    let cancelled = false;
    let key = 0;

    const schedule = () => {
      timer.current = setTimeout(
        () => {
          if (cancelled) return;
          key += 1;
          setGlint(randomEdgeGlint(key));
          schedule();
        },
        4000 + Math.random() * 3000,
      );
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      setGlint(null);
    };
  }, [animate]);

  if (!animate || !glint) {
    return null;
  }

  return (
    <span
      key={glint.key}
      aria-hidden="true"
      style={
        {
          position: "absolute",
          left: glint.left,
          top: glint.top,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FFF5E6 0%, #FBE0BD 35%, rgb(228 153 103 / 0) 100%)",
          filter: "blur(3px)",
          pointerEvents: "none",
          "--dx": `${glint.dx}px`,
          "--dy": `${glint.dy}px`,
          animation: "glintTravel 1s ease-out forwards",
        } as CSSProperties
      }
    />
  );
}
