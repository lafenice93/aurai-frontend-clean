// [Backend 공통] 채팅 한 턴: 문맥 조립 → OpenAI Responses → 저장. route는 검증과 HTTP 매핑만 한다.
import OpenAI from "openai";
import { newId } from "@/app/lib/id";
import type { ChatMessage } from "@/app/lib/types";
import { buildContext, buildInstructions, type ContextInput } from "./context";
import { conversationStore } from "./conversation";
import { CHAT_MODEL, getOpenAI } from "./openai";

const MAX_OUTPUT_TOKENS = 700;
const REQUEST_TIMEOUT_MS = 40_000;

export type ReplyResult =
  | { ok: true; message: ChatMessage; responseId: string }
  | { ok: false; kind: "empty" | "timeout" | "auth" | "rate_limit" | "upstream"; status?: number };

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.info("[chat]", ...args);
  }
};

export async function generateReply(input: ContextInput & { message: string }): Promise<ReplyResult> {
  const context = buildContext(input);
  const instructions = buildInstructions(context);
  const state = await conversationStore.get(input.conversationId);

  const call = (previousResponseId: string | null) =>
    getOpenAI().responses.create(
      {
        model: CHAT_MODEL,
        instructions,
        input: [{ role: "user", content: [{ type: "input_text", text: input.message }] }],
        previous_response_id: previousResponseId ?? undefined,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: true,
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

  const startedAt = Date.now();
  let response;
  try {
    try {
      response = await call(state?.previousResponseId ?? null);
    } catch (error) {
      // 이전 응답 id가 만료·삭제됐으면 체인을 끊고 새로 시작한다.
      if (state?.previousResponseId && error instanceof OpenAI.APIError && error.status === 404) {
        devLog("previous response gone, restarting chain", input.conversationId);
        await conversationStore.reset(input.conversationId);
        response = await call(null);
      } else {
        throw error;
      }
    }
  } catch (error) {
    // Log only classified provider metadata; never payloads, prompts, keys or headers.
    console.error("[chat] provider failure", {
      category: error instanceof OpenAI.APIError ? "api" : error instanceof OpenAI.APIConnectionTimeoutError ? "timeout" : "connection_or_internal",
      status: error instanceof OpenAI.APIError ? error.status : undefined,
      code: error instanceof OpenAI.APIError && typeof error.code === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(error.code) ? error.code : undefined,
    });
    if (error instanceof OpenAI.APIConnectionTimeoutError) return { ok: false, kind: "timeout" };
    if (error instanceof OpenAI.AuthenticationError) return { ok: false, kind: "auth" };
    if (error instanceof OpenAI.RateLimitError) return { ok: false, kind: "rate_limit" };
    if (error instanceof OpenAI.APIError) return { ok: false, kind: "upstream", status: error.status };
    return { ok: false, kind: "upstream" };
  }

  const text = response.output_text.trim();
  devLog("reply", {
    conversationId: input.conversationId,
    ms: Date.now() - startedAt,
    chained: Boolean(state?.previousResponseId),
    chars: text.length,
    status: response.status,
  });

  if (!text) {
    return { ok: false, kind: "empty" };
  }

  const now = new Date().toISOString();
  const user: ChatMessage = { id: newId(), role: "user", content: { type: "text", text: input.message }, createdAt: now };
  const assistant: ChatMessage = { id: newId(), role: "assistant", content: { type: "text", text }, createdAt: now };
  await conversationStore.append(input.conversationId, { user, assistant, responseId: response.id });

  return { ok: true, message: assistant, responseId: response.id };
}
