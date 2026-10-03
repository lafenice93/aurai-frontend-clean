// AURAI 추천 카드·분석 페이지에 쓰는 브론즈 구슬 일러스트 (CSS만으로 그린다).
export default function Orb({ size = 78 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 self-center"
      style={{ width: size, height: size }}
    >
      {/* 구슬 아래 바닥 반사 */}
      <span
        className="absolute bottom-0 left-1/2 h-[12px] w-[130%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(255 214 170 / 0.55), transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 28%, #FFF3E4 0%, #F5CBA1 24%, #DDA173 55%, #AE6C41 84%, #8B5334 100%)",
          boxShadow:
            "0 0 20px rgb(240 190 140 / 0.55), inset -7px -9px 18px rgb(118 68 38 / 0.45), inset 7px 9px 16px rgb(255 238 214 / 0.35)",
        }}
      />

      {/* 하이라이트 */}
      <span
        className="absolute left-[27%] top-[19%] h-[16%] w-[23%] rounded-full"
        style={{ background: "rgb(255 252 245 / 0.85)", filter: "blur(2px)" }}
      />
    </div>
  );
}
