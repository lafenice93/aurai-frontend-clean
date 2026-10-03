// [Backend 공통] Context Builder — 모델에 넣을 사용자 맥락을 한 곳에서 조립한다.
// 지금은 대화 안에서 고른 피부타입·고민·이름만 있다. 나중에 Supabase(프로필, 화장대, 루틴, 체크인, 대화 메모리)를
// 여기서 읽어 채우면 route와 프롬프트는 그대로다.
import { findConcern, type ConcernId } from "@/app/lib/concerns";
import { findSkinType, type SkinTypeId } from "@/app/lib/skinTypes";

export type ContextInput = {
  conversationId: string;
  userName?: string | null;
  skinType?: SkinTypeId | null;
  concern?: ConcernId | null;
};

/** 어떤 데이터 소스가 연결돼 있는지. 모델이 "아는 척" 하지 않도록 프롬프트에 그대로 적는다. */
export type ContextSource = {
  key: "profile" | "skinType" | "concern" | "todaySkin" | "products" | "routine" | "checkins" | "memory" | "realtime";
  label: string;
  connected: boolean;
  value?: string;
};

export type AuraiContext = {
  sources: ContextSource[];
};

export function buildContext(input: ContextInput): AuraiContext {
  const skinType = findSkinType(input.skinType ?? undefined);
  const concern = findConcern(input.concern ?? undefined);
  const name = input.userName?.trim() || null;

  // TODO(Supabase): profile / todaySkin / products / routine / checkins / memory를 여기서 조회한다.
  return {
    sources: [
      { key: "profile", label: "사용자 이름", connected: Boolean(name), value: name ?? undefined },
      {
        key: "skinType",
        label: "피부 타입",
        connected: Boolean(skinType),
        value: skinType ? `${skinType.label} — ${skinType.tagline}. 권장 방향: ${skinType.care}` : undefined,
      },
      { key: "concern", label: "주요 피부 고민", connected: Boolean(concern), value: concern?.label },
      { key: "todaySkin", label: "오늘의 피부 상태(체크인)", connected: false },
      { key: "products", label: "화장대에 등록된 제품 목록", connected: false },
      { key: "routine", label: "저장된 루틴", connected: false },
      { key: "checkins", label: "과거 기록·히스토리", connected: false },
      { key: "memory", label: "이전 대화 세션의 메모리", connected: false },
      { key: "realtime", label: "실시간 정보(날씨, 뉴스, 검색)", connected: false },
    ],
  };
}

export function buildInstructions(context: AuraiContext) {
  const connected = context.sources.filter((source) => source.connected);
  const missing = context.sources.filter((source) => !source.connected);

  return [
    "당신은 AURAI — 피부 고민을 함께 풀어가는 AI 스킨케어 파트너입니다.",
    "한국어 해요체로, 따뜻하고 간결하게 답합니다. 보통 2~4문장, 필요할 때만 짧은 목록을 씁니다. 이모지는 쓰지 않습니다.",
    "스킨케어·화장품·피부 습관에 관한 대화가 중심이지만, 사용자가 일상 잡담이나 다른 주제를 꺼내면 자연스럽게 함께 대화합니다. 명령어만 받는 봇처럼 굴지 않습니다.",
    "의학적 진단은 하지 않습니다. 통증·심한 염증·감염이 의심되면 피부과 상담을 권합니다.",
    "",
    "## 지금 알고 있는 사용자 정보 (연결됨)",
    ...(connected.length > 0
      ? connected.map((source) => `- ${source.label}: ${source.value ?? "있음"}`)
      : ["- (아직 없음)"]),
    "",
    "## 아직 연결되지 않은 정보 — 절대 지어내지 마세요",
    ...missing.map((source) => `- ${source.label}`),
    "위 정보가 필요한 질문(예: \"내 화장대 크림 중 뭐가 좋아?\", \"저번에 등록한 제품 뭐였지?\", \"오늘 서울 날씨\")에는",
    "아직 그 정보를 볼 수 없다고 솔직하게 말한 뒤, 사용자가 직접 알려주면 도울 수 있다고 안내하거나 일반적인 조언으로 대신합니다.",
    "사용자가 이 대화 안에서 직접 말해준 내용(예: 오늘 볼이 당긴다)은 기억하고 이어서 활용합니다.",
    connected.some((source) => source.key === "profile")
      ? "사용자 이름은 프로필의 givenName입니다. 이 이름 그대로 뒤에 '님'을 붙이고, 성을 붙이거나 첫 글자를 잘라내지 마세요. 대화 기록의 다른 이름으로 호칭하지 마세요."
      : "현재 프로필에 개인 이름(givenName)이 없습니다. 이름·성·이메일·사용자 ID를 추측하거나 이전 대화에서 가져와 호칭하지 마세요.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
