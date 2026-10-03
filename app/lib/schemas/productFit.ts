// [Mobile 재사용] STEP 2·3 — 식별된 제품의 성분(지식 기반)과 사용자 피부 궁합. 서버·클라이언트가 같은 정의를 쓴다.
import { z } from "zod";

export const ProductFitRequestSchema = z.object({
  product: z.object({
    brand: z.string().nullable(),
    productName: z.string().nullable(),
    category: z.string().nullable(),
    visibleText: z.array(z.string()).default([]),
  }),
  /** SkinTypeId. 서버가 라벨·케어 방향으로 풀어 모델에 준다. */
  skinType: z.string().nullable(),
  /** ConcernId */
  concern: z.string().nullable(),
});
export type ProductFitRequest = z.infer<typeof ProductFitRequestSchema>;

// 모델이 채우는 부분. 제품을 확실히 모르면 known=false, 성분·점수는 비운다 — 지어내지 않는다.
export const ProductFitModelSchema = z.object({
  known: z.boolean(),
  /** 자연스러운 한국어 표시명. 예: "아누아 수딩 앰플" */
  displayName: z.string(),
  category: z.string().nullable(),
  keyIngredients: z.array(
    z.object({
      name: z.string(),
      /** 2~4 단어짜리 역할. 예: "진정·보습" */
      role: z.string(),
    }),
  ),
  /** 0~100. known=false면 null. 서버가 범위를 다시 죈다. */
  fitScore: z.number().nullable(),
  fitSummary: z.string(),
  positives: z.array(z.string()),
  cautions: z.array(z.string()),
  usage: z.string(),
});

export const ProductFitResultSchema = ProductFitModelSchema.extend({
  skinTypeLabel: z.string().nullable(),
  concernLabel: z.string().nullable(),
  analyzedAt: z.number(),
});
export type ProductFitResult = z.infer<typeof ProductFitResultSchema>;
