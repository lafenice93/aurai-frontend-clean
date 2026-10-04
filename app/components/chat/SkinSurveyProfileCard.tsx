import Image from "next/image";
import { findConcern } from "@/app/lib/concerns";
import { profileAddress } from "@/app/lib/profile";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";
import { findSkinType } from "@/app/lib/skinTypes";
import { SkinIcon } from "./icons";

/** A summary of survey selections, shown before the user supplies a photo. */
export default function SkinSurveyProfileCard({ name, context }: {
  name?: string;
  context: SkinPhotoContext;
}) {
  const type = findSkinType(context.skinType);
  const concern = findConcern(context.concern);
  const address = profileAddress(name);
  const areas = [...context.areaLabels, context.customArea.trim()].filter(Boolean).join(", ");
  const selections = [
    { label: "피부 타입", value: type?.label ?? "", icon: "type" },
    { label: "피부 고민", value: concern?.label ?? "", icon: "concern" },
    { label: "고민 부위", value: areas, icon: "area" },
  ];

  return (
    <section data-testid="skin-survey-profile" className="skin-survey-profile">
      <div className="skin-glass-card skin-survey-panel">
        <h2 className="flex items-center gap-2 text-[20px] font-medium leading-snug">
          <SkinIcon name="sparkles" size={26} />
          {address ? `${address}의 피부 프로필` : "피부 프로필"}
        </h2>
        {type ? <div className="skin-survey-overview">
          <figure className="relative min-w-0 overflow-hidden rounded-xl">
            <Image src={type.photo} alt={`${type.label} 피부 예시 이미지`} width={435} height={300}
              sizes="(max-width: 360px) 85vw, 180px" className="h-full min-h-[132px] w-full object-cover" />
            <figcaption className="absolute bottom-2 left-2 rounded-full bg-[#513522]/65 px-2 py-1 text-[11px] text-[#FFF3E5]">피부 예시</figcaption>
          </figure>
          <div className="min-w-0 self-center">
            <h3 className="text-[19px] font-medium leading-snug">{type.label} 피부</h3>
            <p className="mt-3 text-[14px] leading-relaxed">{type.tagline}</p>
          </div>
        </div> : null}
        <p className="mt-4 text-[13px] opacity-80">선택해 주신 피부 정보를 정리했어요.</p>
      </div>
      <dl className="skin-glass-card skin-survey-panel mt-3">
        {selections.map(item => <div key={item.icon} className="skin-survey-selection">
          <span aria-hidden="true" className="skin-survey-icon">
            {item.icon === "type" ? <SkinIcon name={type?.icon ?? "droplet"} size={27} /> :
              <svg viewBox="0 0 32 32" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                {item.icon === "concern" ? <><path d="M5 11q4-4 8 0t8 0t6 0M5 17q4-4 8 0t8 0t6 0M5 23q4-4 8 0t8 0t6 0" /></> : <><circle cx="16" cy="16" r="9" /><circle cx="16" cy="16" r="2" /><path d="M16 3v6m0 14v6M3 16h6m14 0h6" /></>}
              </svg>}
          </span>
          <div className="min-w-0">
            <dt className="text-[13px] opacity-80">{item.label}</dt>
            <dd className="mt-1 text-[16px] font-medium leading-relaxed">{item.value}</dd>
          </div>
        </div>)}
      </dl>
    </section>
  );
}
