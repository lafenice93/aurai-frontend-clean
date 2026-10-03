// [Backend 공통] 대화 문맥 저장소. 브라우저는 새 메시지 하나만 보내고, 이전 문맥은 서버가 이어 붙인다.
// 지금은 프로세스 메모리(재시작하면 비워짐). 인터페이스를 유지한 채 Supabase + 요약 메모리로 바꿀 수 있다.
import type { ChatMessage } from "@/app/lib/types";

export type ConversationState = {
  /** OpenAI Responses 연속성 — 이전 응답 id를 주면 모델이 앞 대화를 이어서 본다. */
  previousResponseId: string | null;
  /** 최근 대화 기록(요약·메모리 생성용). 창 크기를 넘으면 앞을 버린다. */
  transcript: ChatMessage[];
  updatedAt: number;
};

export interface ConversationStore {
  get(conversationId: string): Promise<ConversationState | null>;
  append(conversationId: string, turn: { user: ChatMessage; assistant: ChatMessage; responseId: string }): Promise<void>;
  /** 응답 체인이 끊겼을 때(만료 등) 처음부터 다시 시작하도록 지운다. */
  reset(conversationId: string): Promise<void>;
}

const TRANSCRIPT_WINDOW = 40; // 메시지 수(사용자+어시스턴트)
const MAX_CONVERSATIONS = 500;

class MemoryConversationStore implements ConversationStore {
  private readonly map = new Map<string, ConversationState>();

  async get(conversationId: string) {
    return this.map.get(conversationId) ?? null;
  }

  async append(conversationId: string, turn: { user: ChatMessage; assistant: ChatMessage; responseId: string }) {
    const current = this.map.get(conversationId);
    const transcript = [...(current?.transcript ?? []), turn.user, turn.assistant].slice(-TRANSCRIPT_WINDOW);
    this.map.delete(conversationId);
    if (this.map.size >= MAX_CONVERSATIONS) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(conversationId, { previousResponseId: turn.responseId, transcript, updatedAt: Date.now() });
  }

  async reset(conversationId: string) {
    this.map.delete(conversationId);
  }
}

// 개발 서버(HMR)에서도 하나만 유지되도록 globalThis에 둔다.
const globalStore = globalThis as unknown as { __auraiConversations?: ConversationStore };
export const conversationStore: ConversationStore =
  globalStore.__auraiConversations ?? (globalStore.__auraiConversations = new MemoryConversationStore());
