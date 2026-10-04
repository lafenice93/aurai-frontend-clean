import type { ReactNode } from "react";
import type { IllustrationId } from "./content";
import styles from "./ConcernProfile.module.css";

// Role symbols, not chemical structures. Shared 32-unit coordinate system.
const drawings: Record<IllustrationId, ReactNode> = {
  pores: <><path d="M3 24h26" /><ellipse cx="9" cy="12" rx="3" ry="4" /><ellipse cx="22" cy="15" rx="3" ry="4" /><path d="M15 5v2M15 21v2" /></>,
  oil: <><path d="M16 3C13 9 7 14 7 20a9 9 0 0 0 18 0C25 14 19 9 16 3Z" /><path d="M11 21q0 4 4 5" /></>,
  shine: <><path d="M4 24q12-5 24 0M16 3v5M4 8l4 4M28 8l-4 4M2 17h5M25 17h5" /><path d="M10 20q6-13 12 0" /></>,
  spots: <><path d="M3 25q12-3 26 0" /><circle cx="8" cy="10" r="2" /><circle cx="19" cy="7" r="1.5" /><circle cx="23" cy="17" r="3" /><circle cx="12" cy="19" r="2" /></>,
  tone: <><circle cx="16" cy="16" r="11" /><path d="M16 5v22M20 8v16M24 12v8" /></>,
  patches: <><path d="M4 8q6-7 10 0t13 1M4 24q6-5 12 0t12-3M5 14q5-3 7 1t9 3q8 0 6-5M8 20l1 1" /></>,
  tightness: <><path d="M12 7q-3 9 0 18M20 7q3 9 0 18M2 16h7l-3-3m3 3-3 3M30 16h-7l3-3m-3 3 3 3" /></>,
  flakes: <><path d="M3 25h26M5 19l5-4 4 4M17 14l4-5 5 4M9 8l3-3 3 2M21 23l4-3 4 2" /></>,
  texture: <><path d="M3 9q3-4 6 0t6 0 6 0 8 0M3 16q3-4 6 0t6 0 6 0 8 0M3 23q3-4 6 0t6 0 6 0 8 0" /></>,
  bump: <><path d="M3 25h5c3 0 2-10 8-10s5 10 8 10h5M16 4v5M5 10l4 4M27 10l-4 4" /></>,
  repeat: <><path d="M6 12A11 11 0 0 1 26 9M26 4v6h-6M26 20A11 11 0 0 1 6 23M6 28v-6h6" /><circle cx="16" cy="16" r="3" /></>,
  redness: <><path d="M4 24h24M7 19q9-12 18 0M7 9l-2-3M16 5V2M25 9l2-3" /><path d="M11 23q5-6 10 0" /></>,
  sting: <><path d="m18 3-8 14h7l-3 12 10-17h-8l2-9ZM3 23h4M26 23h3" /></>,
  itch: <><path d="m9 5 4 4-4 4 4 4M19 5l4 4-4 4 4 4M3 25q13-5 26 0" /></>,
  lines: <><path d="M5 8q8 4 22 0M5 15q8 4 22 0M5 22q8 4 22 0" /></>,
  sagging: <><path d="M5 5q0 22 11 22T27 5M16 10v10m-4-4 4 4 4-4" /></>,
  elasticity: <><path d="M5 20q11 9 22 0M16 22V5m-4 4 4-4 4 4M5 11v5M27 11v5" /></>,
  indent: <><path d="M3 12h6c2 0 2 10 7 10s5-10 7-10h6M3 28h26" /></>,
  raised: <><path d="M3 22h6c2 0 2-10 7-10s5 10 7 10h6M3 28h26" /></>,
  camera: <><path d="M11 7l2-3h6l2 3h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><circle cx="16" cy="17" r="6" /><path d="M24 11h1" /></>,
  gallery: <><rect x="3" y="5" width="26" height="23" rx="3" /><circle cx="11" cy="12" r="3" /><path d="m4 25 8-8 5 5 5-6 7 7" /></>,
  sparkle: <path d="M16 2q2 12 14 14-12 2-14 14C14 18 2 16 2 16S14 14 16 2Z" />,
  moisture: <><path d="M16 3C13 9 7 14 7 20a9 9 0 0 0 18 0C25 14 19 9 16 3Z" /><path d="M10 20q3-3 6 0t6 0" /></>,
  barrier: <><path d="M16 3q6 5 12 5c0 12-4 17-12 21C8 25 4 20 4 8q6 0 12-5Z" /><path d="m11 16 4 4 7-8" /></>,
  leaf: <><path d="M7 25C-1 10 15 4 27 4c0 15-5 25-20 21ZM5 29 23 9M12 22v-8M18 16h6" /></>,
};
export function Illustration({ id }: { id: IllustrationId }) {
  return <svg data-icon={id} aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.illustration}>{drawings[id]}</svg>;
}
export default function GlassRing({ icon, large = false }: { icon: IllustrationId; large?: boolean }) {
  return <span aria-hidden="true" className={`${styles.ring} ${large ? styles.largeRing : ""}`}><Illustration id={icon} /></span>;
}
