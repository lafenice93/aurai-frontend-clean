import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import type { SkinAnalysis } from "@/app/lib/skinAnalysis";

export const runtime = "nodejs";
const origin = "https://yce-api-01.makeupar.com";
const taskPath = "/s2s/v2.1/task/skin-analysis";
const root = join(process.cwd(), ".data", "perfect-skin");
type Receipt = SkinAnalysis & { taskId?: string; createdAt: number };
const metric = z.object({ type: z.string(), region: z.string().optional(), raw_score: z.number().finite().optional(), ui_score: z.number().finite().optional(), skin_type: z.string().optional() });
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function authorize(request: Request, storagePath: string) {
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { global: { headers: { Authorization: token } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token.slice(7));
  if (error || !data.user || !storagePath.startsWith(`${data.user.id}/`) || storagePath.includes("..") || storagePath.split("/").length !== 2) return null;
  const id = createHash("sha256").update(`${data.user.id}:${storagePath}`).digest("hex");
  return { client, directory: join(root, id) };
}
async function load(directory: string): Promise<Receipt | null> {
  try { return JSON.parse(await readFile(join(directory, "receipt.json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
async function save(directory: string, receipt: Receipt) {
  const temporary = join(directory, `${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(receipt), { mode: 0o600, flag: "wx" });
  await rename(temporary, join(directory, "receipt.json"));
}
function publicReceipt(receipt: Receipt): SkinAnalysis {
  return { status: receipt.status, apiVersion: "2.1", metrics: receipt.metrics, message: receipt.message };
}
async function api(path: string, body?: unknown) {
  const response = await fetch(`${origin}${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${process.env.PERFECT_CORP_API_KEY?.trim()}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error("PROVIDER_REQUEST_FAILED");
  const result = await response.json();
  if (result.status !== 200 || !result.data) throw new Error("PROVIDER_RESPONSE_INVALID");
  return result.data;
}

export async function POST(request: Request) {
  if (process.env.PERFECT_CORP_ANALYSIS_ENABLED === "false") return reply({ message: "피부 분석 연동은 현재 중단되어 있어요." }, 503);
  // This durable disk receipt supports the local, single-server test. Do not enable
  // on ephemeral/serverless production until a shared transactional task store exists.
  if (process.env.NODE_ENV === "production") return reply({ message: "배포 환경의 분석 접수 저장소가 아직 준비되지 않았어요." }, 503);
  if (!process.env.PERFECT_CORP_API_KEY?.trim()) return reply({ message: "피부 분석 API 설정을 확인해 주세요." }, 503);
  try {
    const body = await request.json();
    if (typeof body.storagePath !== "string" || body.storagePath.length > 200) return reply({ message: "사진 경로를 확인해 주세요." }, 400);
    const owner = await authorize(request, body.storagePath);
    if (!owner) return reply({ message: "로그인 후 본인의 사진을 제출해 주세요." }, 401);
    await mkdir(root, { recursive: true, mode: 0o700 });
    // Atomic lock, deliberately never removed: duplicate POST can only inspect.
    try { await mkdir(owner.directory, { mode: 0o700 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await load(owner.directory);
      return reply(existing ? publicReceipt(existing) : { status: "uncertain", apiVersion: "2.1", message: "접수 상태를 확인할 수 없어 자동으로 다시 분석하지 않았어요." });
    }
    let receipt: Receipt = { status: "starting", apiVersion: "2.1", createdAt: Date.now() };
    await save(owner.directory, receipt);
    let taskSubmitted = false;
    try {
      const { data: photo, error } = await owner.client.storage.from("skin-photos").download(body.storagePath);
      if (error || !photo || photo.size > 15_000_000) throw new Error("PHOTO_DOWNLOAD_FAILED");
      // Fail closed if the existing object is anonymously readable. No bucket policy changes.
      const publicUrl = owner.client.storage.from("skin-photos").getPublicUrl(body.storagePath).data.publicUrl;
      const visibility = await fetch(publicUrl, { method: "HEAD", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (![400, 403, 404].includes(visibility.status)) throw new Error("PRIVATE_STORAGE_REQUIRED");
      const source = Buffer.from(await photo.arrayBuffer());
      const metadata = await sharp(source).metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1) throw new Error("PHOTO_INVALID");
      const prepared = await sharp(source).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 95 }).toBuffer({ resolveWithObject: true });
      if (Math.min(prepared.info.width, prepared.info.height) < 480 || prepared.data.length >= 10_000_000) throw new Error("PHOTO_SIZE_INVALID");
      const upload = await api("/s2s/v2.0/file", { files: [{ content_type: "image/jpeg", file_name: "skin.jpg", file_size: prepared.data.length }] });
      const file = upload.files?.[0];
      const put = file?.requests?.[0];
      if (!file?.file_id || !put?.url || put.method !== "PUT" || file.requests.length !== 1) throw new Error("UPLOAD_INVALID");
      const destination = new URL(put.url);
      if (destination.protocol !== "https:" || !destination.hostname.endsWith(".amazonaws.com")) throw new Error("UPLOAD_HOST_INVALID");
      const uploaded = await fetch(destination, { method: "PUT", headers: put.headers, body: new Uint8Array(prepared.data), redirect: "error", signal: AbortSignal.timeout(60_000) });
      if (!uploaded.ok) throw new Error("UPLOAD_FAILED");
      // Mark before sending: a timeout/crash must never resubmit a paid task.
      receipt = { ...receipt, status: "uncertain", message: "분석 접수 결과를 확인 중이에요. 같은 사진은 다시 요청하지 않아요." };
      await save(owner.directory, receipt);
      taskSubmitted = true;
      const task = await api(taskPath, { src_file_id: file.file_id, dst_actions: ["pore", "texture", "redness", "oiliness"], format: "json" });
      if (typeof task.task_id !== "string" || !task.task_id) throw new Error("TASK_INVALID");
      receipt = { ...receipt, status: "running", taskId: task.task_id, message: undefined };
      await save(owner.directory, receipt);
      return reply(publicReceipt(receipt));
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message = code === "PRIVATE_STORAGE_REQUIRED" ? "사진 저장소가 비공개인지 확인할 수 없어 업체에 전달하지 않았어요. 저장소 설정을 확인해 주세요." : code === "PHOTO_SIZE_INVALID" ? "사진의 짧은 변이 480px 이상이고 용량이 10MB 미만이어야 해요. 다시 촬영해 주세요." : "사진을 분석에 전달하지 못했어요. 로그인·사진 크기·연결 상태를 확인해 주세요.";
      receipt = { ...receipt, status: taskSubmitted ? "uncertain" : "error", message: taskSubmitted ? "분석 접수 여부가 불확실해요. 중복 결제를 막기 위해 자동 재요청하지 않았어요." : message };
      await save(owner.directory, receipt);
      return reply(publicReceipt(receipt));
    }
  } catch { return reply({ message: "분석 접수에 실패했어요. 같은 사진의 접수 상태를 먼저 확인해 주세요." }, 500); }
}

export async function GET(request: Request) {
  if (process.env.PERFECT_CORP_ANALYSIS_ENABLED === "false") return reply({ message: "피부 분석 연동은 현재 중단되어 있어요." }, 503);
  try {
    const path = new URL(request.url).searchParams.get("storagePath");
    if (!path || path.length > 200) return reply({ message: "사진 경로가 필요해요." }, 400);
    const owner = await authorize(request, path);
    if (!owner) return reply({ message: "로그인이 필요해요." }, 401);
    let receipt = await load(owner.directory);
    if (!receipt) return reply({ message: "분석 접수 기록이 없어요." }, 404);
    if (receipt.status === "starting" && Date.now() - receipt.createdAt > 180_000) {
      receipt = { ...receipt, status: "uncertain", message: "접수 상태를 확인할 수 없어 자동 재요청하지 않았어요." };
    }
    if (receipt.status !== "running" || !receipt.taskId) return reply(publicReceipt(receipt));
    const result = await api(`${taskPath}/${encodeURIComponent(receipt.taskId)}`);
    if (result.task_status === "success") {
      const output = z.array(metric).safeParse(result.results?.output);
      receipt = output.success ? { ...receipt, status: "success", metrics: output.data } : { ...receipt, status: "error", message: "결과 형식을 확인할 수 없어요. 점수는 표시하지 않았어요." };
    } else if (result.task_status === "error") {
      receipt = { ...receipt, status: "error", message: "분석에 실패했어요. 밝은 곳에서 정면 얼굴이 잘 보이도록 다시 촬영해 주세요." };
    } else if (result.task_status !== "running") throw new Error("UNKNOWN_STATUS");
    await save(owner.directory, receipt);
    return reply(publicReceipt(receipt));
  } catch { return reply({ message: "결과 조회에 실패했어요. 잠시 후 상태 확인을 눌러 주세요." }, 502); }
}
