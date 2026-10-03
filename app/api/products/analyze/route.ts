import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { findSkinType, type SkinTypeId } from "@/app/lib/skinTypes";
import { supabaseAdmin } from "@/app/lib/supabase";

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_READY =
  "제품 분석 기능이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.";

const ProductSchema = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      brand: z.string(),
      category: z.string(),
      keyIngredients: z.array(z.string()),
      fitsSkinType: z.boolean(),
      note: z.string(),
    }),
  ),
  summary: z.string(),
});

function parseDataUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);

  if (!match) {
    return null;
  }

  const mediaType = match[1] as (typeof ALLOWED_MEDIA)[number];

  if (!ALLOWED_MEDIA.includes(mediaType)) {
    return null;
  }

  return { dataUrl: value, data: match[2] };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[products/analyze] OPENAI_API_KEY is not set");
    return NextResponse.json(
      { error: "NOT_CONFIGURED", message: NOT_READY },
      { status: 503 },
    );
  }

  let body: { image?: unknown; skinType?: unknown; conversationId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "요청 본문을 읽을 수 없습니다." },
      { status: 400 },
    );
  }

  const image = parseDataUrl(body.image);

  if (!image) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "JPEG/PNG/WebP 이미지가 필요합니다." },
      { status: 400 },
    );
  }

  // base64는 원본의 약 4/3 크기다.
  if ((image.data.length * 3) / 4 > MAX_BYTES) {
    return NextResponse.json(
      { error: "TOO_LARGE", message: "이미지가 5MB를 넘습니다." },
      { status: 413 },
    );
  }

  const skinType = findSkinType(body.skinType as SkinTypeId | undefined);
  const client = new OpenAI();

  try {
    const response = await client.responses.parse({
      model: "gpt-5.1",
      instructions: [
        "사진 속 스킨케어 제품을 식별하는 뷰티 어시스턴트입니다.",
        "라벨에서 읽을 수 있는 것만 적고, 읽히지 않으면 빈 문자열로 두세요. 추측하지 마세요.",
        skinType
          ? `사용자의 피부 타입은 ${skinType.label}이며, 권장 방향은 "${skinType.care}"입니다. fitsSkinType과 note는 이 기준으로 판단하세요.`
          : "피부 타입 정보가 없으므로 fitsSkinType은 일반적인 기준으로 판단하세요.",
        "note와 summary는 한국어로, 각각 한 문장으로 작성하세요.",
      ].join("\n"),
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: image.dataUrl, detail: "auto" },
            {
              type: "input_text",
              text: "이 사진에 보이는 스킨케어 제품을 모두 찾아 정리해 주세요.",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(ProductSchema, "product_analysis") },
    });

    if (!response.output_parsed) {
      return NextResponse.json(
        { error: "UNREADABLE", message: "제품을 읽어내지 못했습니다." },
        { status: 422 },
      );
    }

    // 분석은 이미 성공했으니 저장 실패는 로그만 남기고 결과는 그대로 돌려준다.
    const conversationId =
      typeof body.conversationId === "string" && UUID.test(body.conversationId)
        ? body.conversationId
        : null;

    if (conversationId) {
      try {
        const db = supabaseAdmin();
        await db
          .from("conversations")
          .upsert({ id: conversationId }, { onConflict: "id", ignoreDuplicates: true });
        const { error } = await db
          .from("product_analyses")
          .insert({ conversation_id: conversationId, result: response.output_parsed });
        if (error) console.error("[products/analyze] persist failed:", error.message);
      } catch (error) {
        console.error("[products/analyze] persist unavailable:", (error as Error).message);
      }
    }

    return NextResponse.json(response.output_parsed);
  } catch (error) {
    if (error instanceof OpenAI.AuthenticationError) {
      console.error("[products/analyze] OPENAI_API_KEY was rejected");
      return NextResponse.json(
        { error: "NOT_CONFIGURED", message: NOT_READY },
        { status: 503 },
      );
    }

    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    if (error instanceof OpenAI.APIError) {
      console.error("[products/analyze] upstream error", error.status, error.message);
      return NextResponse.json(
        { error: "UPSTREAM", message: `분석 요청이 실패했습니다 (${error.status}).` },
        { status: 502 },
      );
    }

    throw error;
  }
}
