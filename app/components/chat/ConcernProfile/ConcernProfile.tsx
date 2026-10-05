"use client";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";
import { CARD_GAP_MS } from "@/app/lib/reveal";
import { ProfileEditor } from "../SkinProfileCard";
import { concernProfile, topicParticle } from "./content";
import RecommendationStar from "./RecommendationStar";
import GlassRing from "./GlassRing";
import styles from "./ConcernProfile.module.css";

function ProfileBlock({ index, testId, children }: { index: number; testId: string; children: ReactNode }) {
  const [shown, setShown] = useState(index === 0);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), index * CARD_GAP_MS);
    return () => window.clearTimeout(timer);
  }, [index]);
  return shown ? <section className={styles.block} data-testid={testId}>{children}</section> : null;
}

export default function ConcernProfile({ context, onUpdate, canEdit }: {
  context: SkinPhotoContext;
  onUpdate: (context: SkinPhotoContext) => void; canEdit: boolean;
}) {
  const guide = concernProfile(context);
  const explanationTitle = context.concern === "dryness-flaking" && context.areaIds.at(-1) === "cheek" && !context.customArea.trim()
    ? "건조·각질" : guide.title;
  const [editing, setEditing] = useState(false);
  return <div className={styles.group} data-testid="concern-profile" data-concern={context.concern}>
    <ProfileBlock index={0} testId="concern-explanation">
      <div className={styles.intro}>
        <figure><Image src={guide.photo} alt={guide.photoLabel} width={450} height={300} sizes="(max-width: 430px) 42vw, 180px" className={styles.photo} style={{ objectPosition: guide.photoFocus }} /></figure>
        <div><div className={styles.introTitle}><GlassRing icon={guide.features[0].icon} /><h2>{explanationTitle}{topicParticle(explanationTitle) === "이" ? "이란?" : "란?"}</h2></div><p>{guide.description}</p></div>
      </div>
    </ProfileBlock>
    <ProfileBlock index={1} testId="concern-features">
      <h2>{guide.title}의 주요 특징</h2>
      <ul className={styles.grid}>{guide.features.map(feature => <li key={feature.id} data-feature={feature.id} className={styles.item}><GlassRing icon={feature.icon} /><span>{feature.label}</span></li>)}</ul>
    </ProfileBlock>
    <ProfileBlock index={2} testId="concern-ingredients">
      <h2>{guide.title}에 도움되는 성분</h2>
      {guide.ingredients.length ? <ul className={styles.grid}>{guide.ingredients.map(ingredient => <li key={ingredient.id} data-ingredient={ingredient.id} className={styles.item}><GlassRing icon={ingredient.icon} /><span>{ingredient.korean}</span><span className={styles.english}>{ingredient.english}</span></li>)}</ul> : <p className={styles.pending}>이 고민과 {guide.type} 피부에 맞는 성분 안내를 준비하고 있어요.</p>}
    </ProfileBlock>
    <ProfileBlock index={3} testId="concern-recommendation">
      <div className={styles.recommendation}><div><h2><span className={styles.brandStar} aria-hidden="true"><RecommendationStar /></span>AURAI 추천</h2><p>{guide.recommendation}</p></div><Image src="/images/concern-guide-orb-warm-v2.png" alt="" width={320} height={320} sizes="112px" className={styles.orb} /></div>
    </ProfileBlock>
    <ProfileBlock index={4} testId="concern-photo-request">
      <div className={styles.request}><GlassRing icon="camera" large /><div><h2>{guide.request}</h2><p>AURAI가 알려주신 피부 정보와 사진을 함께 살펴 맞춤 케어 방향을 안내해 드릴게요.</p></div></div>
    </ProfileBlock>
    {canEdit ? <button type="button" className={styles.edit} onClick={() => setEditing(true)}>정보 수정</button> : null}
    {editing && canEdit ? <ProfileEditor context={context} onSave={updated => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} /> : null}
  </div>;
}
