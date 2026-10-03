// [Mobile 재사용] 제품 API 클라이언트. fetch만 쓰므로 Next·RN 어디서든 같은 백엔드를 부른다.
import type { CapturedPhoto } from "@/app/lib/camera/types";
import { traceFail, traceStep } from "@/app/lib/products/diagnostics";
import {
  ProductFitResultSchema,
  type ProductFitRequest,
  type ProductFitResult,
} from "@/app/lib/schemas/productFit";
import {
  ProductImageResultSchema,
  type ProductImageRequest,
  type ProductImageResult,
} from "@/app/lib/schemas/productImage";
import {
  ProductRecognitionResultSchema,
  type ProductRecognitionResult,
} from "@/app/lib/schemas/productRecognition";
import type { ProductAnalysis } from "@/app/lib/types";

type Failure = { ok: false; status: number; message: string | null };

async function failure(response: Response): Promise<Failure> {
  const detail = (await response.json().catch(() => null)) as { message?: string } | null;
  return { ok: false, status: response.status, message: detail?.message ?? null };
}

// 서버가 응답하지 않을 때 로딩이 영원히 남지 않도록 자른다. (OpenAI 비전은 보통 3~20초)
export const RECOGNIZE_TIMEOUT_MS = 90_000;

/** 사진 속 화장품 후보 인식. Blob을 multipart로 그대로 보낸다(base64 변환 없음). */
export async function recognizeProducts(
  photo: CapturedPhoto,
  baseUrl = "",
): Promise<{ ok: true; result: ProductRecognitionResult } | Failure> {
  const form = new FormData();
  form.append("image", photo.blob, `capture.${photo.mimeType === "image/jpeg" ? "jpg" : "bin"}`);

  traceStep("request-start", { bytes: photo.blob.size, type: photo.blob.type, url: `${baseUrl}/api/product-recognition` });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECOGNIZE_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/product-recognition`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    traceFail(timedOut ? "request-timeout" : "request-network", {
      ms: Date.now() - startedAt,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
    return { ok: false, status: 0, message: null };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const result = await failure(response);
    traceFail("request-status", { status: response.status, message: result.message, ms: Date.now() - startedAt });
    return result;
  }
  traceStep("request-success", { status: response.status, ms: Date.now() - startedAt });

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    traceFail("response-json", error instanceof Error ? error.message : String(error));
    return { ok: false, status: response.status, message: null };
  }
  traceStep("response-received", { keys: body && typeof body === "object" ? Object.keys(body) : typeof body });

  const parsed = ProductRecognitionResultSchema.safeParse(body);
  if (!parsed.success) {
    traceFail("parse-schema", parsed.error.issues.slice(0, 3));
    return { ok: false, status: response.status, message: null };
  }
  traceStep("parse-success", {
    count: parsed.data.products.length,
    usable: parsed.data.imageQuality.usable,
    issues: parsed.data.imageQuality.issues,
  });
  return { ok: true, result: parsed.data };
}

/** 브랜드 공식 제품 사진. 못 찾으면 imageUrl null — 호출자는 촬영 crop을 그대로 쓴다. */
export async function lookupProductImage(
  payload: ProductImageRequest,
  baseUrl = "",
): Promise<ProductImageResult> {
  try {
    const response = await fetch(`${baseUrl}/api/product-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(RECOGNIZE_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { imageUrl: null, sourceUrl: null };
    }
    const parsed = ProductImageResultSchema.safeParse(await response.json().catch(() => null));
    return parsed.success ? parsed.data : { imageUrl: null, sourceUrl: null };
  } catch {
    return { imageUrl: null, sourceUrl: null };
  }
}

/** STEP 2·3: 식별된 제품의 성분(지식 기반)과 피부 궁합. 텍스트만 보낸다. */
export async function analyzeProductFit(
  payload: ProductFitRequest,
  baseUrl = "",
): Promise<{ ok: true; result: ProductFitResult } | Failure> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/product-fit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(RECOGNIZE_TIMEOUT_MS),
    });
  } catch (error) {
    traceFail("fit-request-network", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    return { ok: false, status: 0, message: null };
  }

  if (!response.ok) {
    return failure(response);
  }

  const parsed = ProductFitResultSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    traceFail("fit-parse-schema", parsed.error.issues.slice(0, 3));
    return { ok: false, status: response.status, message: null };
  }
  return { ok: true, result: parsed.data };
}

// ---- 아래는 이전 단계의 성분·적합성 분석 API. 현재 흐름에서는 쓰지 않는다(제품 DB 매칭 뒤 재연결 예정). ----

export type AnalyzeProductsRequest = {
  /** data URL (image/jpeg·png·webp) */
  image: string;
  skinType: string | null;
  conversationId: string;
};

export async function analyzeProducts(
  payload: AnalyzeProductsRequest,
  baseUrl = "",
): Promise<{ ok: true; result: ProductAnalysis } | Failure> {
  const response = await fetch(`${baseUrl}/api/products/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return failure(response);
  }
  return { ok: true, result: (await response.json()) as ProductAnalysis };
}
