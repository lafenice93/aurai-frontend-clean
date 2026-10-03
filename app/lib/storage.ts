import { newId } from "./id";
import { supabaseBrowser } from "./supabase";
import type { SkinPhotoContext } from "./skinPhoto";

export const SKIN_PHOTO_BUCKET = "skin-photos";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 카메라 카드가 만드는 data URL을 업로드용 Blob으로 바꾼다.
export function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const type = /^data:([^;]+);base64$/.exec(header)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

// TODO: 보관기간·삭제 정책 결정 필요.
//   얼굴 사진은 민감정보라 정해지기 전까지 이 함수는 "저장만" 한다.
//   정책이 나오면 (1) 만료 기준 자동 삭제, (2) 사용자 요청 삭제, (3) 분석 후 즉시 폐기 중 무엇을 택할지 반영할 것.
export async function uploadSkinPhoto(blob: Blob, context?: SkinPhotoContext) {
  const supabase = supabaseBrowser();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 경로 첫 폴더가 본인 user_id여야 Storage 정책을 통과한다.
  const ext = EXT_BY_TYPE[blob.type] ?? "jpg";
  const path = `${user.id}/${newId()}.${ext}`;

  const { error } = await supabase.storage
    .from(SKIN_PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
      // 비공개 사진 객체에 설문 스냅샷도 저장해 이후 분석에서 같은 정보를 읽는다.
      metadata: context,
    });

  if (error) {
    throw error;
  }

  return path;
}

// 비공개 버킷이라 조회는 서명 URL로만. 기본 10분.
export async function signedSkinPhotoUrl(path: string, expiresIn = 600) {
  const { data, error } = await supabaseBrowser()
    .storage.from(SKIN_PHOTO_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
