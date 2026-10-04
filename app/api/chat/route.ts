import { NextResponse } from "next/server";
import { generateReply } from "@/app/lib/ai/chat";
import { isOpenAIConfigured } from "@/app/lib/ai/openai";
import { concerns, type ConcernId } from "@/app/lib/concerns";
import { skinTypes, type SkinTypeId } from "@/app/lib/skinTypes";
import { supabaseAdmin } from "@/app/lib/supabase";
import type { ChatRequest, ChatResponse } from "@/app/lib/types";
import { profileGivenName } from "@/app/lib/profile";

const skinTypeIds = new Set<string>(skinTypes.map((type) => type.id));
const concernIds = new Set<string>(concerns.map((concern) => concern.id));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_CHARS = 2000;
const NOT_READY = "AURAI가 지금 대화를 이어가기 어려워요. 잠시 후 다시 시도해 주세요.";

type Stored = { skin_type: SkinTypeId | null; concern: ConcernId | null };

// 대화 상태를 저장하고 현재 값을 돌려준다. DB가 안 되면 null — 답변은 요청값으로 계속한다.
async function persist(
  conversationId: string,
  patch: { skin_type?: SkinTypeId; concern?: ConcernId; user_name?: string | null },
): Promise<Stored | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("conversations")
      .upsert({ id: conversationId, ...patch }, { onConflict: "id" })
      .select("skin_type, concern")
      .single();

    if (error) {
      console.error("[chat] persist failed:", error.message);
      return null;
    }

    return data as Stored;
  } catch (error) {
    console.error("[chat] persist unavailable:", (error as Error).message);
    return null;
  }
}

export async function POST(request: Request) {
  let body: Partial<ChatRequest>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "메시지를 읽지 못했어요. 다시 보내 주세요." },
      { status: 400 },
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const conversationId =
    typeof body.conversationId === "string" && UUID.test(body.conversationId)
      ? body.conversationId
      : "";

  if (!message || !conversationId) {
    return NextResponse.json(
      {
        error: "INVALID_INPUT",
        message: "대화를 확인하지 못했어요. 화면을 새로고침한 뒤 다시 보내 주세요.",
      },
      { status: 400 },
    );
  }

  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: `메시지는 ${MAX_MESSAGE_CHARS}자까지 보낼 수 있어요.` },
      { status: 400 },
    );
  }

  if (body.selectedSkinType && !skinTypeIds.has(body.selectedSkinType)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "알 수 없는 피부타입입니다." },
      { status: 400 },
    );
  }

  if (body.selectedConcern && !concernIds.has(body.selectedConcern)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "알 수 없는 피부 고민입니다." },
      { status: 400 },
    );
  }

  const patch: Parameters<typeof persist>[1] = {};
  if (body.selectedSkinType) patch.skin_type = body.selectedSkinType;
  if (body.selectedConcern) patch.concern = body.selectedConcern;
  // 클라이언트나 URL의 이름 대신 검증한 로그인 계정의 개인 이름만 사용한다.
  let userName: string | null = null;
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (token) {
    try {
      const { data, error } = await supabaseAdmin().auth.getUser(token);
      if (!error) userName = profileGivenName(data.user?.user_metadata);
    } catch { /* 프로필 조회 실패 시 호칭을 생략한다. */ }
  }
  patch.user_name = userName;

  const stored = await persist(conversationId, patch);
  const skinType = stored?.skin_type ?? body.selectedSkinType ?? null;
  const concern = stored?.concern ?? body.selectedConcern ?? null;

  // 카드 선택 같은 이벤트는 저장만 하고 답변을 만들지 않는다.
  if (body.silent) {
    const ack: ChatResponse = { id: crypto.randomUUID(), message: "", timestamp: new Date().toISOString() };
    return NextResponse.json(ack);
  }

  if (!isOpenAIConfigured()) {
    console.error("[chat] OPENAI_API_KEY is not set");
    return NextResponse.json({ error: "NOT_CONFIGURED", message: NOT_READY }, { status: 503 });
  }

  const result = await generateReply({ conversationId, message, userName, skinType, concern });

  if (!result.ok) {
    const map = {
      empty: { status: 502, error: "EMPTY", message: "답변을 만들지 못했어요. 다시 한 번 말씀해 주세요." },
      timeout: { status: 504, error: "TIMEOUT", message: "응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요." },
      auth: { status: 503, error: "NOT_CONFIGURED", message: NOT_READY },
      rate_limit: { status: 429, error: "RATE_LIMITED", message: "요청이 많아요. 잠시 후 다시 시도해 주세요." },
      upstream: { status: 502, error: "UPSTREAM", message: "AURAI가 답변을 준비하지 못했어요. 잠시 후 다시 말씀해 주세요." },
    } as const;
    const mapped = map[result.kind];
    console.error("[chat] reply failed", { kind: result.kind, status: result.status });
    return NextResponse.json({ error: mapped.error, message: mapped.message }, { status: mapped.status });
  }

  const reply: ChatResponse = {
    id: result.message.id,
    message: result.message.content.type === "text" ? result.message.content.text : "",
    timestamp: result.message.createdAt,
  };
  return NextResponse.json(reply);
}
