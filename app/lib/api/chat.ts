// [Mobile 재사용] 채팅 API 클라이언트. 브라우저는 새 메시지 하나만 보낸다 — 문맥은 서버가 잇는다.
import type { ChatRequest, ChatResponse } from "@/app/lib/types";
import { authHeaders } from "./authHeaders";

export const CHAT_TIMEOUT_MS = 45_000;

export type SendResult =
  | { ok: true; reply: ChatResponse }
  | { ok: false; kind: "network" | "timeout" | "api" | "empty"; status?: number; message: string | null };

export async function sendChatMessage(payload: ChatRequest, baseUrl = ""): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...await authHeaders() },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return { ok: false, kind: timedOut ? "timeout" : "network", message: null };
  }

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { message?: string } | null;
    return {
      ok: false,
      kind: response.status === 504 ? "timeout" : "api",
      status: response.status,
      message: detail?.message ?? null,
    };
  }

  const reply = (await response.json().catch(() => null)) as ChatResponse | null;
  if (!reply || typeof reply.message !== "string") {
    return { ok: false, kind: "empty", status: response.status, message: null };
  }
  return { ok: true, reply };
}
