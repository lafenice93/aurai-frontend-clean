// [Mobile 재사용] 촬영 결과의 공통 형태. 웹(getUserMedia)·RN(expo-camera) 어느 쪽이 찍어도 이 형태로 넘긴다.
// 이후 AURAI 분석 로직은 이 타입만 알면 된다.
export type CapturedPhoto = {
  blob: Blob;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  /** epoch ms */
  capturedAt: number;
  source: "camera" | "file";
};
