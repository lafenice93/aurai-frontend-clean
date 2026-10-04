"use client";
import Image from "next/image";
import { useState } from "react";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";
import { ProfileEditor } from "../SkinProfileCard";
import { concernProfile, topicParticle } from "./content";
import GlassRing, { Illustration } from "./GlassRing";
import styles from "./ConcernProfile.module.css";

export default function ConcernProfile({ context, onUpload, onCamera, onUpdate, busy, canEdit }: {
  context: SkinPhotoContext; onUpload: () => void; onCamera: () => void;
  onUpdate: (context: SkinPhotoContext) => void; busy: boolean; canEdit: boolean;
}) {
  const guide = concernProfile(context);
  const [editing, setEditing] = useState(false);
  return <div className={styles.group} data-testid="concern-profile" data-concern={context.concern}>
    <section className={styles.block} data-testid="concern-explanation">
      <div className={styles.intro}>
        <figure><Image src={guide.photo} alt={guide.photoLabel} width={450} height={300} sizes="(max-width: 430px) 42vw, 180px" className={styles.photo} style={{ objectPosition: guide.photoFocus }} /><figcaption className={styles.caption}>설명용 예시 · 사용자 사진 아님</figcaption></figure>
        <div><div className={styles.introTitle}><GlassRing icon={guide.features[0].icon} /><h2>{guide.title}{topicParticle(guide.title) === "이" ? "이란?" : "란?"}</h2></div><p>{guide.description}</p></div>
      </div>
      <div className={styles.selections} data-testid="concern-selections"><span>피부 타입 · {guide.type}</span><span>피부 고민 · {guide.concern}</span><span>고민 부위 · {guide.areas}</span></div>
    </section>
    <section className={styles.block} style={{ animationDelay: "100ms" }} data-testid="concern-features">
      <h2>{guide.title}의 주요 특징</h2>
      <ul className={styles.grid}>{guide.features.map(feature => <li key={feature.id} data-feature={feature.id} className={styles.item}><GlassRing icon={feature.icon} /><span>{feature.label}</span></li>)}</ul>
      <p className={styles.note}>일반적인 특징이며, 모두 해당하는 것은 아니에요.</p>
    </section>
    <section className={styles.block} style={{ animationDelay: "200ms" }} data-testid="concern-ingredients">
      <h2>{guide.title}에 도움되는 성분</h2>
      {guide.ingredients.length ? <ul className={styles.grid}>{guide.ingredients.map(ingredient => <li key={ingredient.id} data-ingredient={ingredient.id} className={styles.item}><GlassRing icon={ingredient.icon} /><span>{ingredient.korean}</span><span className={styles.english}>{ingredient.english}</span></li>)}</ul> : <p className={styles.pending}>이 고민과 {guide.type} 피부에 맞는 성분 안내를 준비하고 있어요.</p>}
    </section>
    <section className={styles.block} style={{ animationDelay: "300ms" }} data-testid="concern-recommendation">
      <div className={styles.recommendation}><div><h2><Illustration id="sparkle" />AURAI 추천</h2><p>{guide.recommendation}</p></div><Image src="/images/concern-guide-orb-warm-v2.png" alt="" width={320} height={320} sizes="112px" className={styles.orb} /></div>
    </section>
    <section className={styles.block} style={{ animationDelay: "400ms" }} data-testid="concern-photo-request">
      <div className={styles.request}><GlassRing icon="camera" large /><div><h2>{guide.request}</h2><p>AURAI가 알려주신 피부 정보와 사진을 함께 살펴 맞춤 케어 방향을 안내해 드릴게요.</p></div></div>
      <div className={styles.buttons}><button type="button" onClick={onUpload} disabled={busy} data-testid="concern-upload"><Illustration id="gallery" />사진 업로드</button><button type="button" onClick={onCamera} disabled={busy} data-testid="concern-camera"><Illustration id="camera" />카메라 촬영</button></div>
    </section>
    {canEdit ? <button type="button" className={styles.edit} onClick={() => setEditing(true)}>정보 수정</button> : null}
    {editing && canEdit ? <ProfileEditor context={context} onSave={updated => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} /> : null}
  </div>;
}
