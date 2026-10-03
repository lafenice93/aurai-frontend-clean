export type SkinTypeId =
  | "dry"
  | "oily"
  | "combination"
  | "sensitive"
  | "dehydrated-oily"
  | "normal";

export type SkinTypeIcon =
  | "droplet"
  | "droplet-oily"
  | "droplet-pair"
  | "leaf"
  | "droplet-dotted"
  | "sparkles";

export type SkinType = {
  id: SkinTypeId;
  label: string;
  icon: SkinTypeIcon;
  cardLines: [string, string];
  tagline: string;
  care: string;
  photo: string;
};

export const skinTypes: SkinType[] = [
  {
    id: "dry",
    label: "건성",
    icon: "droplet",
    cardLines: ["피부가 건조하고", "당김이 느껴져요."],
    tagline: "건조함과 당김이 느껴지는 피부",
    care: "보습과 진정에 중점을 두는 루틴",
    photo: "/images/skin-types/dry.webp",
  },
  {
    id: "oily",
    label: "지성",
    icon: "droplet-oily",
    cardLines: ["피부가 번들거리고", "피지가 많아요."],
    tagline: "피지 분비가 활발한 피부",
    care: "피지 조절과 가벼운 수분 공급에 중점을 두는 루틴",
    photo: "/images/skin-types/oily.webp",
  },
  {
    id: "combination",
    label: "복합성",
    icon: "droplet-pair",
    cardLines: ["T존은 지성, U존은", "건조한 편이예요."],
    tagline: "부위마다 다른 균형이 필요한 피부",
    care: "부위별로 다르게 접근하는 존별 케어 루틴",
    photo: "/images/skin-types/combination.webp",
  },
  {
    id: "sensitive",
    label: "민감성",
    icon: "leaf",
    cardLines: ["외부 자극에 쉽게", "예민해지는 편이예요."],
    tagline: "자극에 쉽게 반응하는 피부",
    care: "자극을 덜어내고 장벽을 회복시키는 저자극 루틴",
    photo: "/images/skin-types/sensitive.webp",
  },
  {
    id: "dehydrated-oily",
    label: "수분 부족형 지성",
    icon: "droplet-dotted",
    cardLines: ["겉은 번들거리지만", "속은 건조한 편이예요."],
    tagline: "겉과 속의 균형이 무너진 피부",
    care: "유분은 덜어내고 수분을 채우는 수분 중심 루틴",
    photo: "/images/skin-types/dehydrated-oily.webp",
  },
  {
    id: "normal",
    label: "중성",
    icon: "sparkles",
    cardLines: ["유수분 밸런스가 잘 맞고", "트러블이 적어요."],
    tagline: "유수분 밸런스가 안정적인 피부",
    care: "지금의 균형을 지키는 최소한의 유지 루틴",
    photo: "/images/skin-types/normal.webp",
  },
];

export function findSkinType(id: SkinTypeId | undefined) {
  return skinTypes.find((type) => type.id === id);
}
