import Image from "next/image";
import type { SkinType } from "@/app/lib/skinTypes";
import { SpeakerIcon } from "./icons";

export default function SkinTypeMediaCard({ type }: { type: SkinType }) {
  return (
    <figure
      style={{ border: "1.3px solid var(--bubble-stroke)" }}
      className="overflow-hidden rounded-[18px]"
    >
      <div className="relative">
        <Image
          src={type.photo}
          alt={`${type.label} 피부 예시 이미지`}
          width={435}
          height={195}
          sizes="440px"
          className="h-[230px] w-full object-cover"
        />

        <figcaption className="absolute inset-0 flex flex-col items-end justify-center gap-2 bg-gradient-to-l from-black/35 to-transparent px-6 text-right">
          <p className="text-[13px] text-[#F7EEE6]/75">{type.label}이란?</p>
          <p className="text-2xl font-bold leading-tight">
            {type.label} 피부
            <br />
            알아보기
          </p>
          <p className="whitespace-pre-line text-sm text-[#F7EEE6]/85">
            {type.tagline}
          </p>
        </figcaption>
      </div>

      <div
        style={{ background: "var(--bubble-fill)" }}
        className="flex items-center gap-3 px-5 py-3"
      >
        <div className="flex-1">
          <div className="h-[3px] w-full rounded-full bg-[#F7EEE6]/25">
            <div className="h-full w-1.5 rounded-full bg-[#F7EEE6]" />
          </div>
          <p className="mt-2 text-[12px] text-[#F7EEE6]/75">
            {type.label} 피부의 특징
          </p>
        </div>

        <SpeakerIcon className="shrink-0 text-[#F7EEE6]/80" size={18} />
      </div>
    </figure>
  );
}
