import Image from "next/image";

export default function SkinPhotoGuide({}: { name?: string }) {
  return (
    <section data-testid="skin-photo-guide" className="skin-glass-card relative min-h-[138px] overflow-hidden px-5 py-3">
      <h2 className="relative z-10 break-keep text-[20px] font-semibold leading-[1.3] [overflow-wrap:anywhere]">
        ✦ AURAI 추천
      </h2>
      <div className="relative z-10 mt-2 space-y-1 pr-[42%] break-keep text-[12px] leading-[1.55] [overflow-wrap:anywhere]">
        <p>고민되는 부위를 촬영해 주세요.</p>
        <p className="opacity-85">AURAI가 피부에 맞는 케어 방향을 설계합니다.</p>
      </div>
      <Image src="/images/skin-guide-orb.png" alt="" width={1536} height={1024}
        sizes="(max-width: 430px) 52vw, 220px"
        className="pointer-events-none absolute -right-[7px] -bottom-2 h-auto w-[52%] max-w-[220px] object-contain" />
    </section>
  );
}
