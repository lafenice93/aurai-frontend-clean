"use client";
import { useEffect, useState } from "react";
import type { CapturedPhoto } from "@/app/lib/camera/types";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";
import { findSkinType, skinTypes } from "@/app/lib/skinTypes";
import { concerns, findConcern } from "@/app/lib/concerns";
import { getConcernAreaFlow } from "@/app/lib/concernAreas";
import { profileAddress } from "@/app/lib/profile";

const englishNames: Record<SkinPhotoContext["skinType"], string> = {
  dry: "Dry skin", oily: "Oily skin", combination: "Combination skin",
  sensitive: "Sensitive skin", "dehydrated-oily": "Dehydrated oily skin", normal: "Normal skin",
};
function ProfileIcon({ kind }: { kind: "skin" | "focus" | "care" }) {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {kind === "skin" ? <>{[15, 24, 33].map(y => <path key={y} d={`M8 ${y} Q12 ${y - 4} 17 ${y} T27 ${y} T40 ${y}`} />)}</> : kind === "focus" ? <><circle cx="24" cy="24" r="13" /><circle cx="24" cy="24" r="3" /><path d="M24 5v9M24 34v9M5 24h9M34 24h9" /></> : <><path d="M19 7Q21 19 31 21Q21 23 19 35Q17 23 7 21Q17 19 19 7Z" /><path d="M36 28Q37 34 42 36Q37 37 36 43Q35 37 30 36Q35 34 36 28Z" /></>}
  </svg>;
}
export function ProfileEditor({ context, onSave, onCancel }: { context: SkinPhotoContext; onSave: (context: SkinPhotoContext) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(context);
  const areas = getConcernAreaFlow(draft.concern)?.areas ?? [];
  const valid = draft.areaIds.length > 0 || Boolean(draft.customArea.trim());
  const field = "min-h-11 w-full rounded-xl border border-[#E7B882]/40 bg-[#744B35]/80 px-3 text-[14px] text-[#F7EEE6]";
  return <form data-testid="skin-profile-editor" className="skin-glass-card mt-4 space-y-4 p-5" onSubmit={event => {
    event.preventDefault();
    if (valid) onSave({ ...draft, customArea: draft.customArea.trim(), areaLabels: areas.filter(area => draft.areaIds.includes(area.id)).map(area => area.label) });
  }}>
    <h3 className="text-[16px]">피부 정보 수정</h3>
    <label className="block space-y-2 text-[14px]">피부 타입<select aria-label="피부 타입 수정" className={field} value={draft.skinType} onChange={event => setDraft({ ...draft, skinType: event.target.value as SkinPhotoContext["skinType"] })}>{skinTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
    <label className="block space-y-2 text-[14px]">피부 고민<select aria-label="피부 고민 수정" className={field} value={draft.concern} onChange={event => setDraft({ ...draft, concern: event.target.value as SkinPhotoContext["concern"], areaIds: [], areaLabels: [], customArea: "" })}>{concerns.map(concern => <option key={concern.id} value={concern.id}>{concern.label}</option>)}</select></label>
    <fieldset><legend className="mb-2 text-[14px]">고민 부위</legend><div className="flex flex-wrap gap-2">{areas.map(area => <label key={area.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E7B882]/30 px-3 text-[14px]"><input type="checkbox" checked={draft.areaIds.includes(area.id)} onChange={() => setDraft({ ...draft, areaIds: draft.areaIds.includes(area.id) ? draft.areaIds.filter(id => id !== area.id) : [...draft.areaIds, area.id] })} />{area.label}</label>)}</div></fieldset>
    <label className="block space-y-2 text-[14px]">직접 입력<input aria-label="고민 부위 직접 수정" maxLength={100} className={field} value={draft.customArea} onChange={event => setDraft({ ...draft, customArea: event.target.value })} /></label>
    <div className="flex gap-3"><button type="submit" disabled={!valid} className={`${field} disabled:opacity-40`}>수정 완료</button><button type="button" onClick={onCancel} className={field}>취소</button></div>
  </form>;
}
export default function SkinProfileCard({ name, context, photo, onUpdate, onReselect }: {
  name?: string; context: SkinPhotoContext; photo: CapturedPhoto;
  onUpdate: (context: SkinPhotoContext) => void; onReselect: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(photo.blob);
    // Object URL lifetime follows the confirmed Blob and is revoked on removal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo.blob]);
  const address = profileAddress(name);
  const type = findSkinType(context.skinType)?.label ?? "";
  const concern = findConcern(context.concern)?.label ?? "";
  const areas = [...context.areaLabels, context.customArea.trim()].filter(Boolean).join(", ");
  const details = [
    { kind: "skin" as const, title: "피부 타입", text: `선택해 주신 ${type}을 기준으로 살펴봐요.` },
    { kind: "focus" as const, title: "집중할 고민", text: `${areas}의 ${concern} 고민을 중심으로 살펴봐요.` },
    { kind: "care" as const, title: "맞춤 케어 방향", text: "선택해 주신 피부 정보에 맞춰 케어 방향을 정리해요." },
  ];
  return <div className="skin-profile-shell text-[#F7EEE6]">
    <section data-testid="skin-profile-card" className="skin-profile-card">
      <h2 className="flex items-center gap-3 px-5 pb-5 pt-6 text-[18px] sm:px-7"><ProfileIcon kind="care" />{address ? `${address}의 피부 프로필` : "피부 프로필"}</h2>
      <div className="skin-profile-summary"><div className="skin-profile-copy">
        <p className="mb-5 text-[30px] leading-tight sm:text-[36px]">{englishNames[context.skinType]}</p>
        <div className="space-y-2 text-[15px] leading-relaxed"><p>피부 타입 · {type}</p><p>피부 고민 · {concern}</p><p>고민 부위 · {areas}</p></div>
      </div>{url ? (
        // Local Blob only; sending it to an image optimizer would violate this UI-only phase.
        // eslint-disable-next-line @next/next/no-img-element
        <img data-testid="skin-profile-photo" src={url} alt="사용자가 확정한 피부 사진" className="skin-profile-photo" />
      ) : null}</div>
      <div className="mx-5 border-t border-[#E7B882]/30 sm:mx-7" />
      <div className="skin-profile-details">{details.map(item => <div key={item.kind} className="skin-profile-detail"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#E7B882]/65"><ProfileIcon kind={item.kind} /></span><h3 className="mt-3 text-[16px]">{item.title}</h3><p className="mt-2 break-keep text-[14px] leading-relaxed [overflow-wrap:anywhere]">{item.text}</p></div>)}</div>
      <p className="mx-5 border-t border-[#E7B882]/30 py-5 text-[15px] sm:mx-7">맞춤 케어를 시작합니다.</p>
    </section>
    <div className="mt-3 flex flex-wrap justify-center gap-5"><button type="button" onClick={() => setEditing(true)} className="min-h-11 px-2 text-[14px] underline decoration-[1px] underline-offset-[5px]">정보 수정</button><button type="button" onClick={onReselect} className="min-h-11 px-2 text-[14px] underline decoration-[1px] underline-offset-[5px]">사진 다시 선택</button></div>
    {editing ? <ProfileEditor context={context} onSave={updated => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} /> : null}
  </div>;
}
