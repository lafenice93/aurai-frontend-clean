// [Web 전용] 채팅 → 분석 페이지로 제품을 넘기는 임시 저장소(sessionStorage). DB가 생기면 id 조회로 바뀐다.
// RN에서는 navigation params로 같은 payload를 넘기면 된다.
import type { RecognizedProduct } from "@/app/lib/schemas/productRecognition";

export type AnalysisHandoff = {
  product: RecognizedProduct;
  /** 제품 썸네일 data URL (작은 JPEG). 없으면 null */
  thumb: string | null;
  skinType: string | null;
  concern: string | null;
  userName: string;
};

const PREFIX = "aurai.analysis.";

export function saveAnalysisHandoff(id: string, payload: AnalysisHandoff) {
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadAnalysisHandoff(id: string): AnalysisHandoff | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? (JSON.parse(raw) as AnalysisHandoff) : null;
  } catch {
    return null;
  }
}

// "내 루틴에 추가" — 아직 백엔드가 없어 기기 안에만 둔다.
const ROUTINE_KEY = "aurai.routine";

export function routineHas(id: string) {
  try {
    const list = JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "[]") as { id: string }[];
    return list.some((item) => item.id === id);
  } catch {
    return false;
  }
}

export function routineAdd(id: string, displayName: string) {
  try {
    const list = JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "[]") as { id: string; displayName: string; addedAt: number }[];
    if (!list.some((item) => item.id === id)) {
      list.push({ id, displayName, addedAt: Date.now() });
      localStorage.setItem(ROUTINE_KEY, JSON.stringify(list));
    }
    return true;
  } catch {
    return false;
  }
}
