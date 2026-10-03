import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function baseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!raw) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 없습니다.");
  }

  // 대시보드에서 복사하면 /rest/v1/ 경로가 딸려오는 경우가 있어 프로젝트 루트만 남긴다.
  return raw.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

let browserClient: SupabaseClient | null = null;

// 브라우저용. anon 키는 공개돼도 되지만, 접근 범위는 RLS·Storage 정책이 정한다.
export function supabaseBrowser() {
  if (browserClient) {
    return browserClient;
  }

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.");
  }

  browserClient = createClient(baseUrl(), key);
  return browserClient;
}

// 서버 전용. service_role 키는 RLS를 우회하므로 API 라우트 밖으로 절대 내보내지 않는다.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }

  return createClient(baseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
