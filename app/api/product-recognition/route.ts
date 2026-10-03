// [Backend 공통] 사진 속 화장품 후보 인식. OpenAI 키는 여기서만 쓴다.
// 이 단계는 "보이는 것만" 식별한다 — 성분·효능·피부 적합성은 다루지 않는다.
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { newId } from "@/app/lib/id";
import {
  ProductRecognitionModelSchema,
  type ProductRecognitionResult,
} from "@/app/lib/schemas/productRecognition";

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MODEL = "gpt-5.1";
const NOT_READY = "제품 인식 기능이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.";

const INSTRUCTIONS = `You are identifying cosmetic and skincare products from a user-provided photograph.

Only identify products supported by visible evidence in the image.
Do not invent a brand or product name when the package is unreadable.
Do not infer ingredient lists from appearance.
Do not provide skincare recommendations.
Multiple products may be present.
Treat each physically distinct cosmetic container as a separate candidate when appropriate.
If brand or product name cannot be determined reliably, return null for that field and mark the product as needing review.
Visible package text should be returned separately from inferred identity: put the exact strings you can read into visibleText, even when you cannot name the product.
Confidence represents confidence in the product identity, not confidence that an object exists. Use a number from 0 to 1.
category is a short Korean label such as 토너, 세럼, 앰플, 크림, 선크림, 클렌저, 마스크, 미스트, 오일, 립, 파운데이션, 기타. Use null when unclear.
brand and productName should be written as they appear on the package (keep the original language/script).
box is the bounding box of that product's container within the image, normalized to 0–1 (x, y = top-left corner; width, height), including the cap and the whole body. It is used only to crop a thumbnail, so be generous rather than tight. Use null if you cannot localize it.
Also judge the image itself: set imageQuality.usable to false only when the photo cannot support reliable identification, and list the applicable issues from the allowed values. Use no_cosmetic_products when the photo contains no cosmetic or skincare containers.
Never fabricate a product to satisfy the schema; an empty products array is a valid answer.`;

// 개발 중 흐름 확인용. 키·사용자 데이터는 찍지 않는다.
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.info("[product-recognition]", ...args);
  }
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export async function POST(request: Request) {
  devLog("Recognition request started", {
    "OPENAI_API_KEY exists": Boolean(process.env.OPENAI_API_KEY),
    model: MODEL,
    contentType: request.headers.get("content-type")?.split(";")[0] ?? null,
  });

  if (!process.env.OPENAI_API_KEY) {
    console.error("[product-recognition] OPENAI_API_KEY is not set");
    return NextResponse.json({ error: "NOT_CONFIGURED", message: NOT_READY }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "multipart/form-data로 image 파일을 보내주세요." },
      { status: 400 },
    );
  }

  const image = form.get("image");
  if (!(image instanceof Blob) || !ALLOWED_MEDIA.includes(image.type as (typeof ALLOWED_MEDIA)[number])) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "JPEG/PNG/WebP 이미지가 필요합니다." },
      { status: 400 },
    );
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE", message: "이미지가 5MB를 넘습니다." }, { status: 413 });
  }

  devLog("Image received", { type: image.type, bytes: image.size });

  const dataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
  const client = new OpenAI();

  try {
    devLog("OpenAI request start", { model: MODEL, imageBytes: image.size });
    const startedAt = Date.now();
    const response = await client.responses.parse({
      model: MODEL,
      instructions: INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: dataUrl, detail: "high" },
            {
              type: "input_text",
              text: "Identify every cosmetic or skincare product visible in this photo, and assess the image quality.",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(ProductRecognitionModelSchema, "product_recognition") },
    });

    const parsed = response.output_parsed;
    devLog("OpenAI response received", {
      ms: Date.now() - startedAt,
      status: response.status,
      parsed: Boolean(parsed),
      incomplete: response.incomplete_details?.reason ?? null,
    });
    if (!parsed) {
      console.error("[product-recognition] model returned no parsable output");
      return NextResponse.json(
        { error: "UNREADABLE", message: "인식 결과를 읽지 못했습니다." },
        { status: 502 },
      );
    }

    // 모델 출력 뒤처리: 범위 고정, 임시 ID, 정체가 비면 무조건 확인 필요.
    const result: ProductRecognitionResult = {
      imageQuality: parsed.imageQuality,
      products: parsed.products.map((product) => {
        const confidence = clamp01(product.confidence);
        const identified = Boolean(product.brand || product.productName);
        const box = product.box
          ? {
              x: clamp01(product.box.x),
              y: clamp01(product.box.y),
              width: clamp01(product.box.width),
              height: clamp01(product.box.height),
            }
          : null;
        return {
          ...product,
          tempId: newId(),
          confidence,
          needsReview: product.needsReview || !identified,
          // 넓이가 없는 상자는 crop에 못 쓴다.
          box: box && box.width > 0.02 && box.height > 0.02 ? box : null,
        };
      }),
    };

    devLog("Recognition completed", {
      count: result.products.length,
      usable: result.imageQuality.usable,
      issues: result.imageQuality.issues,
    });
    devLog("Detected product count", result.products.length);

    return NextResponse.json(result);
  } catch (error) {
    // 키는 절대 찍지 않는다. 종류(인증/쿼터/크기/스키마)를 구분할 수 있는 필드만.
    console.error("[product-recognition] Recognition error", {
      name: error instanceof Error ? error.name : typeof error,
      status: error instanceof OpenAI.APIError ? error.status : undefined,
      code: error instanceof OpenAI.APIError ? error.code : undefined,
      type: error instanceof OpenAI.APIError ? error.type : undefined,
      message: error instanceof Error ? error.message.slice(0, 300) : String(error),
    });

    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json({ error: "NOT_CONFIGURED", message: NOT_READY }, { status: 503 });
    }
    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "UPSTREAM", message: `인식 요청이 실패했습니다 (${error.status}).` },
        { status: 502 },
      );
    }
    throw error;
  }
}
