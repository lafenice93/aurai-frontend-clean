import { getConcernAreaFlow } from "@/app/lib/concernAreas";
import { findConcern, type ConcernId } from "@/app/lib/concerns";
import { findSkinType, type SkinTypeId } from "@/app/lib/skinTypes";
import type { SkinPhotoContext } from "@/app/lib/skinPhoto";

export type IllustrationId = "pores" | "oil" | "shine" | "spots" | "tone" | "patches" | "pigmentation-wide-spot" | "tightness" | "eye-tightness" | "tightness-dryness" | "flakes" | "texture" | "bump" | "repeat" | "redness" | "sting" | "itch" | "lines" | "nasolabial-lines" | "sagging" | "elasticity" | "indent" | "raised" | "camera" | "gallery" | "sparkle" | "moisture" | "barrier" | "leaf";
type Feature = { id: string; label: string; icon: IllustrationId; image?: string };
type DetailContent = { suffix: string; description: string; features: readonly Feature[] };

// General descriptions of the existing concern categories, not findings from a photo.
// Features expand app/lib/concerns.ts cardText; area photos come from concernAreas.ts.
const details: Record<ConcernId, DetailContent> = {
  "dryness-flaking": { suffix: "건조·각질", description: "당김이나 각질 들뜸, 거친 피부결처럼 느껴지는 고민을 말해요.", features: [
    { id: "tightness", label: "당김", icon: "tightness" }, { id: "flakes", label: "각질 들뜸", icon: "flakes" }, { id: "roughness", label: "거친 피부결", icon: "texture" },
  ] },
  "sebum-pores": { suffix: "모공", description: "피부 표면의 모공이 눈에 띄는 고민이에요. 번들거림이나 표면의 광택을 함께 살펴볼 수 있어요.", features: [
    { id: "visible-pores", label: "눈에 띄는 모공", icon: "pores" }, { id: "oiliness", label: "번들거림", icon: "oil" }, { id: "surface-shine", label: "표면 광택", icon: "shine" },
  ] },
  "acne-trouble": { suffix: "여드름·트러블", description: "뾰루지가 올라오거나 비슷한 부위에 트러블이 반복되는 고민을 말해요.", features: [
    { id: "blemish", label: "뾰루지", icon: "bump" }, { id: "recurring", label: "반복되는 트러블", icon: "repeat" }, { id: "uneven-surface", label: "도드라진 피부결", icon: "texture" },
  ] },
  "redness-sensitivity": { suffix: "붉어짐·민감함", description: "붉은 기가 보이거나 따갑고 가려운 느낌이 신경 쓰이는 고민을 말해요.", features: [
    { id: "redness", label: "붉은 기", icon: "redness" }, { id: "stinging", label: "따가움", icon: "sting" }, { id: "itching", label: "가려움", icon: "itch" },
  ] },
  "pigmentation-tone": { suffix: "기미·잡티", description: "색 얼룩이나 고르지 않은 피부 톤이 눈에 띄는 고민을 말해요.", features: [
    { id: "pigment-spots", label: "색 얼룩", icon: "spots" }, { id: "dullness", label: "칙칙함", icon: "tone" }, { id: "uneven-tone", label: "고르지 않은 톤", icon: "patches" },
  ] },
  "wrinkles-elasticity": { suffix: "주름·탄력", description: "잔주름이 보이거나 처짐, 탄력의 변화가 신경 쓰이는 고민을 말해요.", features: [
    { id: "fine-lines", label: "잔주름", icon: "lines" }, { id: "sagging", label: "처짐", icon: "sagging" }, { id: "elasticity", label: "탄력 변화", icon: "elasticity" },
  ] },
  scars: { suffix: "패임·흉터", description: "피부에 패이거나 도드라져 남은 흔적과 고르지 않은 표면이 신경 쓰이는 고민을 말해요.", features: [
    { id: "indentation", label: "패인 흔적", icon: "indent" }, { id: "raised-mark", label: "도드라진 흔적", icon: "raised" }, { id: "uneven-texture", label: "고르지 않은 표면", icon: "texture" },
  ] },
};

/** Populate only after content review. Never substitute product-fit AI output here. */
export type ReviewedIngredient = {
  id: string; korean: string; english: string; icon: IllustrationId;
  concern: ConcernId; areaIds: readonly string[]; skinTypes: readonly SkinTypeId[];
  review: { sourceUrl: string; reviewedAt: string };
};
export const reviewedIngredients: readonly ReviewedIngredient[] = [];

export function topicParticle(text: string) {
  const last = text.trim().charCodeAt(text.trim().length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? "이" : "가";
}

const careDirections = {
  calming: "자극을 줄이고 진정과 보습을 보완하는 방향",
  moisture: "수분과 보습을 보완하는 방향",
  oilBalance: "과도한 유분 부담을 줄이고 수분 균형을 살피는 방향",
  elasticity: "보습과 탄력 관리를 고려하는 방향",
  tone: "자외선 노출 관리와 피부 톤 균형을 고려하는 방향",
  texture: "피부결과 보습을 편안하게 관리하는 방향",
} as const;
type CareDirection = keyof typeof careDirections;
const concernCareDirection: Partial<Record<ConcernId, CareDirection>> = {
  "redness-sensitivity": "calming",
  "dryness-flaking": "moisture",
  "sebum-pores": "oilBalance",
  "wrinkles-elasticity": "elasticity",
  "pigmentation-tone": "tone",
  scars: "texture",
};
const skinTypeCareDirection: Partial<Record<SkinTypeId, CareDirection>> = {
  sensitive: "calming",
  dry: "moisture",
  oily: "oilBalance",
  "dehydrated-oily": "oilBalance",
};

function selectionRecommendation(context: SkinPhotoContext, type: string, concern: string, detail: string) {
  // The concern sets the focus; the selected skin type adds a complementary direction.
  // Do not infer additional concerns or reuse skin-type descriptions with outcome claims.
  const directionIds = [concernCareDirection[context.concern], skinTypeCareDirection[context.skinType]];
  const directions = [...new Set(directionIds.filter((id): id is CareDirection => id !== undefined))]
    .map(id => careDirections[id]);
  const routine = directions.length
    ? `${directions.join("과 ")}으로 피부 균형과 장벽을 편안하게 돌보는 루틴을 살펴볼게요.`
    : "피부 균형과 장벽을 편안하게 돌보는 루틴 방향을 살펴볼게요.";
  return `${type} 피부에서 ${concern}${topicParticle(concern)} 고민이고, 특히 ${detail}${topicParticle(detail)} 신경 쓰이는 상태예요.\n피부 타입에 맞춰 필요한 것은 보완하고 부담이 될 수 있는 요소는 덜어내면서, ${routine}`;
}

export function concernProfile(context: SkinPhotoContext) {
  const concern = findConcern(context.concern)!;
  const type = findSkinType(context.skinType)!;
  const areaId = context.areaIds.at(-1);
  const area = getConcernAreaFlow(context.concern)?.areas.find(item => item.id === areaId);
  const custom = context.customArea.trim();
  const location = custom || area?.label || context.areaLabels.at(-1) || "선택한 부위";
  const detail = details[context.concern];
  const title = context.concern === "sebum-pores" ? `${location} 모공` : `${location}의 ${detail.suffix}`;
  const ingredients = custom ? [] : reviewedIngredients.filter(item => item.concern === context.concern && item.areaIds.includes(areaId ?? "") && item.skinTypes.includes(context.skinType));
  return {
    title, type: type.label, concern: concern.label,
    areas: [...context.areaLabels, custom].filter(Boolean).join(", "),
    description: detail.description,
    features: detail.features.map(feature => {
      if (context.concern === "pigmentation-tone" && areaId === "cheek" && !custom && feature.id === "uneven-tone") return { ...feature, label: "넓은 색소 얼룩", icon: "pigmentation-wide-spot" as const };
      if (context.concern === "wrinkles-elasticity" && areaId === "nasolabial" && !custom && feature.id === "fine-lines") return { ...feature, icon: "nasolabial-lines" as const };
      if (context.concern !== "dryness-flaking" || custom || feature.id !== "tightness") return feature;
      if (areaId === "cheek") return { ...feature, label: "당김·건조함", icon: "tightness-dryness" as const };
      if (areaId === "eyes") return { ...feature, icon: "eye-tightness" as const };
      return feature;
    }),
    ingredients,
    photo: custom ? concern.photo : area?.photo ?? concern.photo,
    photoFocus: custom ? concern.focus : area?.focus ?? concern.focus,
    photoLabel: custom ? `${concern.label}의 설명용 예시 사진` : `${title}의 설명용 예시 사진`,
    recommendation: selectionRecommendation(context, type.label, concern.label, title),
    request: `${title}${topicParticle(title)} 고민되는 부위의 피부 사진을 업로드해 주세요.`,
  };
}
