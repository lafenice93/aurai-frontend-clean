import { supabaseBrowser } from "../supabase";

export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}
