// [Mobile 재사용] 궁합 점수 표현 규칙. 값은 아직 실측 근거가 없으니 상수로 두고 조정한다.
export const FIT_HIGH = 80;
export const FIT_MID = 60;

export type FitTone = "high" | "mid" | "low";

export function fitTone(score: number): FitTone {
  if (score >= FIT_HIGH) return "high";
  if (score >= FIT_MID) return "mid";
  return "low";
}
