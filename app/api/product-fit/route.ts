// [Backend 공통] 식별된 제품 → (지식 기반) 핵심 성분 → 사용자 피부타입·고민과의 궁합 점수.
// 이미지는 다루지 않는다(그건 /api/product-recognition). 모델이 제품을 확실히 모르면 점수를 매기지 않는다.
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { findConcern, type ConcernId } from "@/app/lib/concerns";
import {
  ProductFitModelSchema,
  ProductFitRequestSchema,
  type ProductFitResult,
} from "@/app/lib/schemas/productFit";
import { findSkinType, type SkinTypeId } from "@/app/lib/skinTypes";

const MODEL = "gpt-5.1";
const NOT_READY = "제품 분석 기능이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.";

const INSTRUCTIONS = `You assess how well a cosmetic or skincare product fits a specific user's skin.

You are given the product identity as read from a photo (brand, product name, category, visible package text) and the user's skin type and main concern.
Use only what you reliably know about this specific product. If you are not confident that you know this product's formulation, set known=false, keyIngredients=[], fitScore=null, and say in fitSummary that the product could not be identified confidently. Never invent ingredients or claims.
Do not make medical claims or diagnose. Do not mention doctors unless the user's concern is clearly medical.
keyIngredients: up to 5 headline ingredients that this product is known for, each with a 2–4 word Korean role (e.g. "진정·보습", "각질 관리", "자외선 차단").
fitScore (0–100): how suitable this product is for the given skin type and concern. 80+ = very suitable, 60–79 = usable with some care, below 60 = not a good match. Consider both the product's purpose and ingredients that could irritate this skin type.
fitSummary: one Korean sentence for the user.
positives: up to 3 short Korean sentences on why it suits them. cautions: up to 3 short Korean sentences on what to watch (e.g. possible irritants, conditional use); empty array if none.
usage: one short Korean sentence on how to use it in a routine (e.g. "세안 후 가볍게 펴 발라주세요.").
displayName: a natural Korean product name — brand in Korean if commonly written so, plus a concise product name (e.g. "아누아 수딩 앰플"). category: a short Korean category label.
All text must be in Korean, polite 해요체.`;

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.info("[product-fit]", ...args);
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[product-fit] OPENAI_API_KEY is not set");
    return NextResponse.json({ error: "NOT_CONFIGURED", message: NOT_READY }, { status: 503 });
  }

  const parsedBody = ProductFitRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "제품 정보가 올바르지 않습니다." },
      { status: 400 },
    );
  }
  const { product, skinType: skinTypeId, concern: concernId } = parsedBody.data;

  if (!product.brand && !product.productName) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "브랜드나 제품명이 있어야 분석할 수 있어요." },
      { status: 400 },
    );
  }

  const skinType = findSkinType((skinTypeId ?? undefined) as SkinTypeId | undefined);
  const concern = findConcern((concernId ?? undefined) as ConcernId | undefined);

  devLog("request", {
    product: { brand: product.brand, productName: product.productName, category: product.category },
    skinType: skinType?.label ?? null,
    concern: concern?.label ?? null,
  });

  const userText = [
    `Product as read from the photo:`,
    `- brand: ${product.brand ?? "(unknown)"}`,
    `- productName: ${product.productName ?? "(unknown)"}`,
    `- category: ${product.category ?? "(unknown)"}`,
    `- visible package text: ${product.visibleText.join(" / ") || "(none)"}`,
    ``,
    `User's skin:`,
    skinType
      ? `- skin type: ${skinType.label} (${skinType.tagline}). Care direction: ${skinType.care}`
      : `- skin type: unknown`,
    concern ? `- main concern: ${concern.label}` : `- main concern: unknown`,
  ].join("\n");

  const client = new OpenAI();

  try {
    const startedAt = Date.now();
    const response = await client.responses.parse({
      model: MODEL,
      instructions: INSTRUCTIONS,
      input: [{ role: "user", content: [{ type: "input_text", text: userText }] }],
      text: { format: zodTextFormat(ProductFitModelSchema, "product_fit") },
    });
    devLog("response", { ms: Date.now() - startedAt, parsed: Boolean(response.output_parsed) });

    const parsed = response.output_parsed;
    if (!parsed) {
      return NextResponse.json(
        { error: "UNREADABLE", message: "분석 결과를 읽지 못했습니다." },
        { status: 502 },
      );
    }

    const result: ProductFitResult = {
      ...parsed,
      // 모르는 제품에는 점수를 주지 않는다. 아는 제품이라도 0~100으로 고정.
      fitScore: parsed.known && parsed.fitScore !== null ? Math.round(clamp(parsed.fitScore, 0, 100)) : null,
      keyIngredients: parsed.known ? parsed.keyIngredients.slice(0, 5) : [],
      positives: parsed.positives.slice(0, 3),
      cautions: parsed.cautions.slice(0, 3),
      skinTypeLabel: skinType?.label ?? null,
      concernLabel: concern?.label ?? null,
      analyzedAt: Date.now(),
    };

    devLog("completed", { known: result.known, fitScore: result.fitScore, ingredients: result.keyIngredients.length });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[product-fit] error", {
      name: error instanceof Error ? error.name : typeof error,
      status: error instanceof OpenAI.APIError ? error.status : undefined,
      message: error instanceof Error ? error.message.slice(0, 300) : String(error),
    });
    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json({ error: "NOT_CONFIGURED", message: NOT_READY }, { status: 503 });
    }
    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." }, { status: 429 });
    }
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "UPSTREAM", message: `분석 요청이 실패했습니다 (${error.status}).` },
        { status: 502 },
      );
    }
    throw error;
  }
}
