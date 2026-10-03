// [Web 전용] video/File → canvas → JPEG Blob. DOM API를 쓰므로 RN에서는 expo-camera 결과로 대체된다.
import type { CapturedPhoto } from "./types";

// 비전 모델은 긴 변 1568px을 넘으면 어차피 축소한다. 미리 줄여 전송 용량을 아낀다.
export const MAX_EDGE = 1568;
const JPEG_QUALITY = 0.85;

function drawScaled(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

async function toPhoto(
  source: CanvasImageSource,
  width: number,
  height: number,
  from: CapturedPhoto["source"],
): Promise<CapturedPhoto> {
  const canvas = drawScaled(source, width, height);
  return {
    blob: new File([await canvasToJpeg(canvas)], `aurai-${from}-${Date.now()}.jpg`, { type: "image/jpeg" }),
    mimeType: "image/jpeg",
    width: canvas.width,
    height: canvas.height,
    capturedAt: Date.now(),
    source: from,
  };
}

/** 재생 중인 video의 현재 프레임을 찍는다. */
export function captureVideoFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) {
    return Promise.reject(new Error("video has no frame yet"));
  }
  return toPhoto(video, video.videoWidth, video.videoHeight, "camera");
}

/** 앨범·기기 카메라 앱에서 받은 파일을 같은 형태로 맞춘다. */
export async function fileToPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("image load failed"));
      element.src = url;
    });
    return toPhoto(image, image.naturalWidth, image.naturalHeight, "file");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(url);
      resolve(element);
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    element.src = url;
  });
}

/**
 * 원본 사진에서 제품 영역(0~1 정규화)을 잘라 썸네일 Object URL로 만든다.
 * 상자 주변에 여유(padding 비율)를 두되 비율은 그대로 — 옆 제품이 딸려 들어오지 않게. 호출자가 revoke한다.
 */
export async function cropThumbnails(
  blob: Blob,
  boxes: ({ x: number; y: number; width: number; height: number } | null)[],
  maxEdge = 400,
  padding = 0.08,
): Promise<(string | null)[]> {
  const image = await loadBlob(blob);
  const W = image.naturalWidth;
  const H = image.naturalHeight;

  return Promise.all(
    boxes.map(async (box) => {
      if (!box) {
        return null;
      }
      const padX = box.width * W * padding;
      const padY = box.height * H * padding;
      const sx = Math.max(box.x * W - padX, 0);
      const sy = Math.max(box.y * H - padY, 0);
      const sw = Math.min(box.width * W + padX * 2, W - sx);
      const sh = Math.min(box.height * H + padY * 2, H - sy);
      if (sw < 4 || sh < 4) {
        return null;
      }

      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw * scale);
      canvas.height = Math.round(sh * scale);
      canvas.getContext("2d")?.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      try {
        const out = await canvasToJpeg(canvas);
        return URL.createObjectURL(out);
      } catch {
        return null;
      }
    }),
  );
}

/** 다음 단계에서 기존 분석 API(dataURL 계약)에 넘길 때 쓴다. 앱 상태에는 보관하지 않는다. */
export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}
