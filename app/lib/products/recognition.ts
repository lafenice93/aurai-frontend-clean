// [Mobile 재사용] 인식 결과 판단 로직. React·DOM 의존 없음.
import type {
  ImageIssue,
  ProductRecognitionResult,
  RecognizedProduct,
} from "@/app/lib/schemas/productRecognition";

// 아직 정확도 데이터에 근거한 값이 아니다. 실측 뒤 조정한다.
export const HIGH_CONFIDENCE = 0.85;
export const REVIEW_CONFIDENCE = 0.6;

/** 카드에 표시할 인식 상태. */
export type RecognitionStatus = "recognized" | "review" | "insufficient";

export function recognitionStatus(product: RecognizedProduct): RecognitionStatus {
  const identified = Boolean(product.brand || product.productName);
  if (!identified || product.confidence < REVIEW_CONFIDENCE) {
    return "insufficient";
  }
  if (product.needsReview || product.confidence < HIGH_CONFIDENCE) {
    return "review";
  }
  return "recognized";
}

/** 결과 전체를 어떻게 보여줄지. */
export type RecognitionOutcome =
  | "success" // 확정 제품이 하나 이상
  | "needs_review" // 후보는 있지만 전부 확인 필요
  | "empty"; // 후보 없음(품질 문제 포함)

export function recognitionOutcome(result: ProductRecognitionResult): RecognitionOutcome {
  const statuses = result.products.map(recognitionStatus);
  // 흐린 사진에서 "무언가 있다"만 잡힌 정체 없는 후보들은 보여줄 가치가 없다 → 재촬영 안내.
  if (statuses.every((status) => status === "insufficient")) {
    return "empty";
  }
  return statuses.includes("recognized") ? "success" : "needs_review";
}

/** 사용자에게 안내할 품질 문제만 골라 순서를 정한다. no_cosmetic_products는 "제품 없음" 문구가 따로 다룬다. */
export function guidanceIssues(result: ProductRecognitionResult): ImageIssue[] {
  const order: ImageIssue[] = [
    "labels_too_small",
    "blur",
    "too_dark",
    "overexposed",
    "products_occluded",
  ];
  return order.filter((issue) => result.imageQuality.issues.includes(issue));
}
