// Official v2.1 smoke test. Default mode validates locally; --run sends the supplied photo.
// https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.1
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";

const origin = "https://yce-api-01.makeupar.com";
const taskPath = "/s2s/v2.1/task/skin-analysis";
const actions = ["pore", "texture", "redness", "oiliness"];

function fail(message) { throw new Error(message); }

async function main() {
  const { values } = parseArgs({ options: {
    image: { type: "string" }, run: { type: "boolean" },
    "task-id": { type: "string" }, help: { type: "boolean" },
    "auth-check": { type: "boolean" },
  } });
  if (values.help || (!values.image && !values["task-id"] && !values["auth-check"])) {
    console.log(`Local validation (no upload):
  node --env-file-if-exists=.env.local scripts/check-perfect-skin.mjs --image /absolute/photo.jpg
Run one SD analysis (uploads photo to Perfect Corp):
  node --env-file-if-exists=.env.local scripts/check-perfect-skin.mjs --image /absolute/photo.jpg --run
Resume polling an existing task without creating another:
  node --env-file-if-exists=.env.local scripts/check-perfect-skin.mjs --task-id TASK_ID --run
Credential: PERFECT_CORP_API_KEY. Requires Node 22+.
Check authentication only (upload slot, no photo upload or analysis task):
  node --env-file-if-exists=.env.local scripts/check-perfect-skin.mjs --auth-check
Actions: ${actions.join(", ")}. Results are saved privately under the OS temp directory.`);
    return;
  }
  if (values.image && values["task-id"]) fail("Use --image or --task-id, not both.");
  if (values["auth-check"] && (values.image || values["task-id"] || values.run)) fail("Use --auth-check on its own.");
  const key = process.env.PERFECT_CORP_API_KEY?.trim();
  if ((values.run || values["auth-check"]) && !key) fail("PERFECT_CORP_API_KEY is missing. No upload or API request was made.");

  if (values["auth-check"]) {
    const response = await fetch(`${origin}/s2s/v2.0/file`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: "auth-check.jpg", file_size: 1 }] }),
    });
    if (!response.ok) fail(`Perfect Corp authentication check HTTP ${response.status}. No photo or analysis task was sent.`);
    const body = await response.json();
    const file = body.data?.files?.[0];
    if (body.status !== 200 || !file?.file_id || !file.requests?.[0]?.url) fail("Authentication check returned an unexpected upload response.");
    console.log(JSON.stringify({ authentication: "success", httpStatus: response.status, auth: "API key Bearer", uploadApiVersion: "2.0", analysisApiVersion: "2.1", photoUploaded: false, analysisTaskCreated: false }));
    return;
  }

  let bytes;
  if (values.image) {
    const source = await readFile(values.image);
    const metadata = await sharp(source).metadata();
    if (!["jpeg", "png"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      fail("Use a single JPEG or PNG front-facing photo.");
    }
    // EXIF rotation, metadata removal and downsize only; no skin/color retouching.
    const prepared = await sharp(source).rotate().resize({
      width: 2560, height: 2560, fit: "inside", withoutEnlargement: true,
    }).jpeg({ quality: 95 }).toBuffer({ resolveWithObject: true });
    bytes = prepared.data;
    if (Math.min(prepared.info.width, prepared.info.height) < 480) fail("SD input needs a short side of at least 480px after resizing.");
    if (bytes.length >= 10_000_000) fail("Prepared photo must be smaller than 10MB.");
    console.log(JSON.stringify({
      mode: values.run ? "live" : "local-only", credentialConfigured: Boolean(key),
      image: { width: prepared.info.width, height: prepared.info.height, bytes: bytes.length },
      actions, format: "json",
    }));
  }
  if (!values.run) {
    console.log("Local checks complete; no photo was uploaded. Face/lighting suitability requires the real API.");
    return;
  }

  async function api(path, payload) {
    const response = await fetch(`${origin}${path}`, {
      method: payload ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    if (!response.ok) fail(`Perfect Corp HTTP ${response.status}. No automatic task resubmission.`);
    const body = await response.json();
    if (body.status !== 200 || !body.data) fail("Unexpected Perfect Corp response. No automatic task resubmission.");
    return body.data;
  }

  // Private artifacts keep task IDs and signed result URLs out of source control/log output.
  const directory = await mkdtemp(join(tmpdir(), "aurai-perfect-skin-"));
  const save = (name, data) => writeFile(join(directory, name), JSON.stringify(data, null, 2), { mode: 0o600, flag: "wx" });
  let taskId = values["task-id"];
  if (!taskId) {
    const upload = await api("/s2s/v2.0/file", { files: [{
      content_type: "image/jpeg", file_name: "skin-test.jpg", file_size: bytes.length,
    }] });
    const file = upload.files?.[0];
    const request = file?.requests?.[0];
    if (!file?.file_id || !request?.url || request.method !== "PUT" || file.requests.length !== 1) {
      fail("Unexpected upload response; photo was not sent.");
    }
    const destination = new URL(request.url);
    if (destination.protocol !== "https:" || !destination.hostname.endsWith(".amazonaws.com")) {
      fail("Upload destination differs from the documented HTTPS S3 host; photo was not sent.");
    }
    const uploaded = await fetch(destination, {
      method: "PUT", headers: request.headers, body: bytes,
      redirect: "error", signal: AbortSignal.timeout(60_000),
    });
    if (!uploaded.ok) fail(`Image upload HTTP ${uploaded.status}; analysis was not started.`);
    const task = await api(taskPath, { src_file_id: file.file_id, dst_actions: actions, format: "json" });
    if (typeof task.task_id !== "string" || !task.task_id) fail("Task response has no task_id; do not resubmit without checking the API console.");
    taskId = task.task_id;
  }
  await save("task.json", { taskId, apiVersion: "2.1", createdAt: new Date().toISOString() });
  console.log(`Task receipt: ${join(directory, "task.json")}`);
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await api(`${taskPath}/${encodeURIComponent(taskId)}`);
    if (result.task_status === "success") {
      if (!Array.isArray(result.results?.output)) fail("Task succeeded but JSON output is missing. Use the saved task ID to inspect it.");
      await save("result.json", { apiVersion: "2.1", receivedAt: new Date().toISOString(), data: result });
      console.log(`Analysis succeeded. Result: ${join(directory, "result.json")}`);
      console.table(result.results.output.map(({ type, region, raw_score, ui_score, skin_type }) => ({
        type, region, raw_score, ui_score, skin_type,
      })));
      return;
    }
    if (result.task_status === "error") {
      await save("error.json", result);
      const code = /^[a-z_]{1,80}$/.test(result.error ?? "") ? result.error : "provider_error";
      fail(`Analysis failed (${code}). Details saved privately under ${directory}.`);
    }
    if (result.task_status !== "running") fail("Unknown task status. Use the saved task ID to inspect it.");
    console.log(`Analysis running (${attempt + 1}/30).`);
    if (attempt < 29) await delay(10_000);
  }
  fail(`Polling stopped after about 5 minutes. Resume with --task-id from ${join(directory, "task.json")}; avoid creating a duplicate task.`);
}

main().catch(error => {
  // Never log request objects, Authorization headers, provider payloads or signed URLs.
  const message = error instanceof Error ? error.message : "Test failed.";
  const key = process.env.PERFECT_CORP_API_KEY?.trim();
  const redacted = key ? message.split(key).join("[credential omitted]") : message;
  console.error(redacted.replace(/https?:\/\/\S+/g, "[URL omitted]"));
  process.exitCode = 1;
});
