import type { CapturedPhoto } from "./camera/types";
import type { SkinTypeId } from "./skinTypes";
import type { ConcernId } from "./concerns";
import type { ConcernAreaId } from "./concernAreas";

/** 사진을 확정할 때의 설문 정보. 이후 선택 변경과 관계없이 함께 유지한다. */
export type SkinPhotoContext = {
  skinType: SkinTypeId;
  concern: ConcernId;
  areaIds: ConcernAreaId[];
  areaLabels: string[];
  customArea: string;
};

/** 피부 분석 API 연결 계약. 사진 확정 시 전달하며, 업로드 성공 시 경로를 함께 전달한다. */
export type SkinPhotoSubmission = {
  photo: CapturedPhoto;
  context: SkinPhotoContext;
  storagePath: string | null;
};
