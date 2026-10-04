import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

// Only the public CA certificate, never the server key or root CA private key.
export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  try {
    const certificate = await readFile(join(process.cwd(), "certificates/dev-root-ca.cer"));
    return new Response(new Uint8Array(certificate), { headers: {
      "Content-Type": "application/x-x509-ca-cert",
      "Content-Disposition": 'attachment; filename="aurai-development-ca.cer"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response("개발용 공개 인증서가 준비되지 않았어요.", { status: 404 });
  }
}
