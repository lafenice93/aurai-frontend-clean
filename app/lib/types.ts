import type { ConcernId } from "./concerns";
import type { SkinTypeId } from "./skinTypes";

export type ChatRequest = {
  message: string;
  selectedSkinType?: SkinTypeId;
  selectedConcern?: ConcernId;
  userName?: string;
  conversationId: string;
  /** true면 선택 저장만 하고 모델은 부르지 않는다(카드 선택 이벤트). */
  silent?: boolean;
};

export type ChatResponse = {
  id: string;
  message: string;
  timestamp: string;
  metadata?: {
    nextStep?: string;
    recommendation?: string;
  };
};

// 대화 메시지 전송/저장 형식. 지금은 text만 쓰고, 이후 이미지·제품·루틴·피부분석 카드로 확장한다.
export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image"; url: string; alt?: string };
export type ProductContent = { type: "product"; productId: string };
export type RoutineContent = { type: "routine"; routineId: string };
export type SkinAnalysisContent = { type: "skin-analysis"; analysisId: string };
export type MessageContent =
  | TextContent
  | ImageContent
  | ProductContent
  | RoutineContent
  | SkinAnalysisContent;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  /** ISO 8601 */
  createdAt: string;
};

export type ProductAnalysis = {
  products: {
    name: string;
    brand: string;
    category: string;
    keyIngredients: string[];
    fitsSkinType: boolean;
    note: string;
  }[];
  summary: string;
};
