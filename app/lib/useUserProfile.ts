"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase";
import { profileGivenName } from "./profile";

export function useUserProfile() {
  const [profile, setProfile] = useState<{ givenName: string | null; loading: boolean }>({ givenName: null, loading: true });
  useEffect(() => {
    let active = true;
    let revision = 0;
    try {
      const auth = supabaseBrowser().auth;
      const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") return;
        revision += 1;
        if (active) setProfile({ givenName: profileGivenName(session?.user.user_metadata), loading: false });
      });
      const initialRevision = revision;
      void auth.getUser().then(({ data, error }) => {
        if (active && revision === initialRevision) setProfile({ givenName: error ? null : profileGivenName(data.user?.user_metadata), loading: false });
      }).catch(() => {
        if (active && revision === initialRevision) setProfile({ givenName: null, loading: false });
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch {
      // 설정이 없는 개발 환경도 조회 완료 후 호칭 없이 표시한다.
      queueMicrotask(() => { if (active) setProfile({ givenName: null, loading: false }); });
      return () => { active = false; };
    }
  }, []);
  return profile;
}
