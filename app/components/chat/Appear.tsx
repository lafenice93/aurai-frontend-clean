"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type AppearProps = {
  /** 마운트 뒤 이만큼(ms) 지나서 나타난다. 그 전에는 DOM에 없다. */
  after: number;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
};

// 차례가 오면 스머징하며 등장하는 상자. 숨어 있는 동안은 렌더하지 않아 탭될 일이 없다.
export default function Appear({
  after,
  as: Tag = "div",
  className,
  children,
}: AppearProps) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const [shown, setShown] = useState(after <= 0);

  useEffect(() => {
    if (after <= 0) {
      return;
    }
    const timer = setTimeout(() => setShown(true), after);
    return () => clearTimeout(timer);
  }, [after]);

  useEffect(() => {
    if (shown && after > 0) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [shown, after]);

  if (!shown) {
    return null;
  }

  return (
    <Tag ref={ref} className={`smudge-block reveal-scroll ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
