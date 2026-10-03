import type { ConcernId } from "./concerns";
import { ko } from "./locale/ko";

export type ConcernAreaId =
  | keyof typeof ko.CONCERN_AREAS
  | keyof typeof ko.SEBUM_CONCERN_AREAS
  | keyof typeof ko.ACNE_CONCERN_AREAS
  | keyof typeof ko.PIGMENTATION_CONCERN_AREAS
  | keyof typeof ko.WRINKLES_CONCERN_AREAS
  | keyof typeof ko.SCARS_CONCERN_AREAS;

export type ConcernAreaFlowId =
  | "dryness-flaking"
  | "sebum-pores"
  | "acne-trouble"
  | "redness-sensitivity"
  | "pigmentation-tone"
  | "wrinkles-elasticity"
  | "scars";

export type ConcernArea = {
  id: ConcernAreaId;
  label: string;
  description: string;
  photo: string;
  focus?: string;
};

export type ConcernAreaFlow = {
  id: ConcernAreaFlowId;
  summary: string;
  question: readonly string[];
  otherLabel: string;
  selection: string;
  areas: readonly ConcernArea[];
  selectAllLabel?: string;
};

const drynessAreaPhotos = {
  cheek: "dryness-flaking-cheek.webp",
  eyes: "dryness-flaking-eye-area.webp",
  mouth: "dryness-flaking-mouth-area.webp",
  "nose-sides": "dryness-flaking-nose-area.webp",
  forehead: "dryness-flaking-forehead.webp",
  chin: "dryness-flaking-chin.webp",
} as const;

export const concernAreas: readonly ConcernArea[] = (
  ["cheek", "eyes", "mouth", "nose-sides", "forehead", "chin"] as const
).map((id) => ({
  id,
  ...ko.CONCERN_AREAS[id],
  photo: `/images/concern-areas/dryness-flaking/${drynessAreaPhotos[id]}`,
}));

const sebumAreaPhotos = {
  forehead: "sebum-pores-forehead.webp",
  "between-brows": "sebum-pores-glabella.webp",
  cheek: "sebum-pores-cheek.webp",
  nose: "sebum-pores-nose.webp",
  "nose-sides": "sebum-pores-nose.webp",
  chin: "sebum-pores-chin.webp",
} as const;

const sebumConcernAreas: readonly ConcernArea[] = (
  ["forehead", "between-brows", "cheek", "nose", "nose-sides", "chin"] as const
).map((id) => ({
  id,
  ...ko.SEBUM_CONCERN_AREAS[id],
  photo: `/images/concern-areas/sebum-pores/${sebumAreaPhotos[id]}`,
}));

const acneAreaPhotos = {
  "forehead-hairline": "acne-trouble-forehead-hairline.webp",
  cheek: "acne-trouble-cheek.webp",
  "nose-sides": "acne-trouble-nose-area.webp",
  "chin-jawline": "acne-trouble-chin-jawline.webp",
  chest: "acne-trouble-chest.webp",
  "upper-back": "acne-trouble-upper-back.webp",
} as const;

const acneConcernAreas: readonly ConcernArea[] = (
  ["forehead-hairline", "cheek", "nose-sides", "chin-jawline", "chest", "upper-back"] as const
).map((id) => ({
  id,
  ...ko.ACNE_CONCERN_AREAS[id],
  photo: `/images/concern-areas/acne-trouble/${acneAreaPhotos[id]}`,
}));

const rednessAreaPhotos = {
  cheek: "redness-sensitivity-cheek.webp",
  "nose-sides": "redness-sensitivity-nose-area.webp",
  mouth: "redness-sensitivity-mouth-area.webp",
  eyes: "redness-sensitivity-eye-area.webp",
  forehead: "redness-sensitivity-forehead.webp",
  chin: "redness-sensitivity-chin.webp",
} as const;

const rednessConcernAreas: readonly ConcernArea[] = (
  ["cheek", "nose-sides", "mouth", "eyes", "forehead", "chin"] as const
).map((id) => ({
  id,
  ...ko.CONCERN_AREAS[id],
  photo: `/images/concern-areas/redness-sensitivity/${rednessAreaPhotos[id]}`,
}));

const pigmentationAreaPhotos = {
  cheek: "pigmentation-tone-cheek.webp",
  forehead: "pigmentation-tone-forehead.webp",
  nose: "pigmentation-tone-nose.webp",
  mouth: "pigmentation-tone-mouth-area.webp",
  "under-eye": "pigmentation-tone-under-eye.webp",
  hand: "pigmentation-tone-hand.webp",
} as const;

const pigmentationConcernAreas: readonly ConcernArea[] = (
  ["cheek", "forehead", "nose", "mouth", "under-eye", "hand"] as const
).map((id) => ({
  id,
  ...ko.PIGMENTATION_CONCERN_AREAS[id],
  photo: `/images/concern-areas/pigmentation-tone/${pigmentationAreaPhotos[id]}`,
}));

const wrinklesAreaPhotos = {
  eyes: "wrinkles-elasticity-eye-area.webp",
  "forehead-glabella": "wrinkles-elasticity-forehead-glabella.webp",
  nasolabial: "wrinkles-elasticity-nasolabial.webp",
  mouth: "wrinkles-elasticity-mouth-area.webp",
  jawline: "wrinkles-elasticity-jawline.webp",
  neck: "wrinkles-elasticity-neck.webp",
} as const;

const wrinklesConcernAreas: readonly ConcernArea[] = (
  ["eyes", "forehead-glabella", "nasolabial", "mouth", "jawline", "neck"] as const
).map((id) => ({
  id,
  ...ko.WRINKLES_CONCERN_AREAS[id],
  photo: `/images/concern-areas/wrinkles-elasticity/${wrinklesAreaPhotos[id]}`,
}));

const scarsAreaPhotos = {
  forehead: "scars-forehead.webp",
  cheek: "scars-cheek.webp",
  chin: "scars-chin.webp",
  "upper-back": "scars-upper-back.webp",
} as const;

const scarsConcernAreas: readonly ConcernArea[] = (
  ["forehead", "cheek", "chin", "upper-back"] as const
).map((id) => ({
  id,
  ...ko.SCARS_CONCERN_AREAS[id],
  photo: `/images/concern-areas/scars/${scarsAreaPhotos[id]}`,
}));

const concernAreaFlows: Record<ConcernAreaFlowId, ConcernAreaFlow> = {
  "dryness-flaking": {
    id: "dryness-flaking",
    summary: ko.DRYNESS_CONCERN_SUMMARY,
    question: ko.CONCERN_AREA_QUESTION,
    otherLabel: ko.CONCERN_AREA_OTHER_LABEL,
    selection: ko.CONCERN_AREA_SELECTION,
    areas: concernAreas,
  },
  "sebum-pores": {
    id: "sebum-pores",
    summary: ko.SEBUM_CONCERN_SUMMARY,
    question: ko.SEBUM_AREA_QUESTION,
    otherLabel: ko.SEBUM_AREA_OTHER_LABEL,
    selection: ko.SEBUM_AREA_SELECTION,
    areas: sebumConcernAreas,
  },
  "acne-trouble": {
    id: "acne-trouble",
    summary: ko.ACNE_CONCERN_SUMMARY,
    question: ko.ACNE_AREA_QUESTION,
    otherLabel: ko.ACNE_AREA_OTHER_LABEL,
    selection: ko.ACNE_AREA_SELECTION,
    areas: acneConcernAreas,
    selectAllLabel: ko.CONCERN_AREA_ALL_REGIONS,
  },
  "redness-sensitivity": {
    id: "redness-sensitivity",
    summary: ko.REDNESS_CONCERN_SUMMARY,
    question: ko.REDNESS_AREA_QUESTION,
    otherLabel: ko.REDNESS_AREA_OTHER_LABEL,
    selection: ko.REDNESS_AREA_SELECTION,
    areas: rednessConcernAreas,
  },
  "pigmentation-tone": {
    id: "pigmentation-tone",
    summary: ko.PIGMENTATION_CONCERN_SUMMARY,
    question: ko.PIGMENTATION_AREA_QUESTION,
    otherLabel: ko.PIGMENTATION_AREA_OTHER_LABEL,
    selection: ko.PIGMENTATION_AREA_SELECTION,
    areas: pigmentationConcernAreas,
  },
  "wrinkles-elasticity": {
    id: "wrinkles-elasticity",
    summary: ko.WRINKLES_CONCERN_SUMMARY,
    question: ko.WRINKLES_AREA_QUESTION,
    otherLabel: ko.WRINKLES_AREA_OTHER_LABEL,
    selection: ko.WRINKLES_AREA_SELECTION,
    areas: wrinklesConcernAreas,
  },
  scars: {
    id: "scars",
    summary: ko.SCARS_CONCERN_SUMMARY,
    question: ko.SCARS_AREA_QUESTION,
    otherLabel: ko.SCARS_AREA_OTHER_LABEL,
    selection: ko.SCARS_AREA_SELECTION,
    areas: scarsConcernAreas,
  },
};

export function getConcernAreaFlow(
  concernId: ConcernId | null | undefined,
): ConcernAreaFlow | null {
  if (
    concernId === "dryness-flaking" ||
    concernId === "sebum-pores" ||
    concernId === "acne-trouble" ||
    concernId === "redness-sensitivity" ||
    concernId === "pigmentation-tone" ||
    concernId === "wrinkles-elasticity" ||
    concernId === "scars"
  ) {
    return concernAreaFlows[concernId];
  }

  return null;
}
