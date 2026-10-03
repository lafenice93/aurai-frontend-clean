// [Mobile 재사용] 브랜드 공식 제품 이미지 조회 결과.
import { z } from "zod";

export const ProductImageRequestSchema = z.object({
  brand: z.string().nullable(),
  productName: z.string().nullable(),
});
export type ProductImageRequest = z.infer<typeof ProductImageRequestSchema>;

export const ProductImageResultSchema = z.object({
  /** 우리 서버가 대신 서빙하는 이미지 경로(/api/product-image?k=…). 못 찾으면 null */
  imageUrl: z.string().nullable(),
  /** 이미지를 가져온 페이지(브랜드 공식/공식 판매처) */
  sourceUrl: z.string().nullable(),
});
export type ProductImageResult = z.infer<typeof ProductImageResultSchema>;
