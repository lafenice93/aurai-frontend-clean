// [Mobile 재사용] 제품 인식 결과 스키마. 서버(OpenAI Structured Output 검증)와 클라이언트(타입)가 같은 정의를 쓴다.
import { z } from "zod";

// 코드에서 관리하는 품질 문제 목록. 모델은 이 값만 고를 수 있다.
export const IMAGE_ISSUES = [
  "blur",
  "too_dark",
  "overexposed",
  "labels_too_small",
  "products_occluded",
  "no_cosmetic_products",
] as const;
export type ImageIssue = (typeof IMAGE_ISSUES)[number];

// 사진 안에서 제품이 차지하는 영역. 0~1 정규화, 좌상단 기준. 썸네일 crop용이라 대략적이어도 된다.
export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

// 모델이 채우는 부분. tempId는 서버가 나중에 붙인다.
export const RecognizedProductModelSchema = z.object({
  brand: z.string().nullable(),
  productName: z.string().nullable(),
  category: z.string().nullable(),
  box: BoundingBoxSchema.nullable(),
  /** 패키지에서 실제로 읽힌 글자. 추론한 정체와 분리해 둔다. */
  visibleText: z.array(z.string()),
  /** 0~1. "제품이 무엇인지"에 대한 확신이지 "물체가 있다"는 확신이 아니다. 서버가 범위를 다시 죈다. */
  confidence: z.number(),
  needsReview: z.boolean(),
});

export const ProductRecognitionModelSchema = z.object({
  products: z.array(RecognizedProductModelSchema),
  imageQuality: z.object({
    usable: z.boolean(),
    issues: z.array(z.enum(IMAGE_ISSUES)),
  }),
});

export const RecognizedProductSchema = RecognizedProductModelSchema.extend({
  /** 이번 촬영 세션 안에서 카드를 구분하는 임시 ID. DB의 product_id가 아니다. */
  tempId: z.string(),
});

export const ProductRecognitionResultSchema = ProductRecognitionModelSchema.extend({
  products: z.array(RecognizedProductSchema),
});

export type RecognizedProduct = z.infer<typeof RecognizedProductSchema>;
export type ProductRecognitionResult = z.infer<typeof ProductRecognitionResultSchema>;
