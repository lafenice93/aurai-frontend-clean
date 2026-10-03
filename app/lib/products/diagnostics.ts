// [Mobile 재사용] 제품 인식 파이프라인 진단 로그. 어느 단계에서 끊기는지 보기 위한 것.
// 키·이미지 본문·사용자 데이터는 절대 넣지 않는다. 성공 로그는 개발에서만, 실패 로그는 항상.
const DEV = process.env.NODE_ENV !== "production";
const TAG = "[product-analysis]";

export type PipelineStep =
  | "capture-ready"
  | "analyze-start"
  | "request-start"
  | "request-success"
  | "response-received"
  | "parse-success"
  | "ui-updated";

export function traceStep(step: PipelineStep, detail?: Record<string, unknown>) {
  if (DEV) {
    console.info(`${TAG} ${step}`, detail ?? "");
  }
}

export function traceFail(step: string, detail?: unknown) {
  console.error(`${TAG} FAILED AT: ${step}`, detail ?? "");
}
