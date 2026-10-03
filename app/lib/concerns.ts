export type ConcernId =
  | "dryness-flaking"
  | "sebum-pores"
  | "acne-trouble"
  | "redness-sensitivity"
  | "pigmentation-tone"
  | "wrinkles-elasticity"
  | "scars";

export type Concern = {
  id: ConcernId;
  label: string;
  cardText: string;
  photo: string;
  /** 핵심 부위가 가운데가 아닌 사진만 지정. */
  focus?: string;
};

export const concerns: Concern[] = [
  {
    id: "dryness-flaking",
    label: "건조·각질",
    cardText: "당김, 들뜸, 거친 피부결",
    photo: "/images/concern-groups/dryness-flaking.webp",
  },
  {
    id: "sebum-pores",
    label: "유분·모공",
    cardText: "번들거림, 눈에 띄는 모공",
    photo: "/images/concern-groups/sebum-pores.webp",
    focus: "30% center",
  },
  {
    id: "acne-trouble",
    label: "여드름·트러블",
    cardText: "뾰루지, 반복되는 트러블",
    photo: "/images/concern-groups/acne-trouble.webp",
  },
  {
    id: "redness-sensitivity",
    label: "붉어짐·민감함",
    cardText: "붉은 기, 따가움, 가려움",
    photo: "/images/concern-groups/redness-sensitivity.webp",
  },
  {
    id: "pigmentation-tone",
    label: "잡티·피부 톤",
    cardText: "색 얼룩, 칙칙함, 고르지 않은 톤",
    photo: "/images/concern-groups/pigmentation-tone.webp",
  },
  {
    id: "wrinkles-elasticity",
    label: "주름·탄력",
    cardText: "잔주름, 처짐, 탄력 저하",
    photo: "/images/concern-groups/wrinkles-elasticity.webp",
    focus: "25% center",
  },
  {
    id: "scars",
    label: "패임·흉터",
    cardText: "패이거나 도드라져 남은 흔적",
    photo: "/images/concern-groups/scars.webp",
  },
];

export function findConcern(id: ConcernId | undefined) {
  return concerns.find((concern) => concern.id === id);
}
