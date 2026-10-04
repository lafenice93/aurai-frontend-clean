// Development-only, password-protected HTTPS tunnel for phone camera testing.
// Start Next separately with npm run dev; cloudflared must be available locally.
import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";

const targetPort = Number(process.env.TARGET_PORT || 3001);
const gatewayPort = Number(process.env.MOBILE_GATEWAY_PORT || 3344);
const binary = process.env.CLOUDFLARED_BIN || "cloudflared";
const username = "aurai";
const password = randomBytes(12).toString("base64url");
const cookie = randomBytes(32).toString("hex");
const cookieName = "__Host-aurai-mobile-test";
let tunnel;
let stopping = false;

function equal(actual, expected) {
  const left = Buffer.from(actual || "");
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(req) {
  const saved = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (equal(saved, cookie)) return true;
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Basic ")) return false;
  return equal(Buffer.from(authorization.slice(6), "base64").toString(), `${username}:${password}`);
}

function headers(req) {
  const result = { ...req.headers, host: `localhost:${targetPort}`, "x-forwarded-proto": "https", "x-forwarded-host": req.headers.host };
  // Keep the app's Bearer token; the test gateway's Basic credentials stop here.
  if (result.authorization?.startsWith("Basic ")) delete result.authorization;
  return result;
}

const server = createServer((req, res) => {
  if (!authorized(req)) {
    res.writeHead(401, { "www-authenticate": 'Basic realm="AURAI mobile test", charset="UTF-8"', "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    res.end("AURAI 모바일 테스트 접속 암호를 입력해 주세요.");
    return;
  }
  const upstream = request({ hostname: "127.0.0.1", port: targetPort, path: req.url, method: req.method, headers: headers(req) }, response => {
    const existing = response.headers["set-cookie"] || [];
    res.writeHead(response.statusCode || 502, {
      ...response.headers,
      "cache-control": "private, no-store",
      "set-cookie": [...existing, `${cookieName}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`],
    });
    response.pipe(res);
  });
  upstream.on("error", () => {
    if (res.headersSent) { res.destroy(); return; }
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("AURAI 개발 서버에 연결하지 못했어요. npm run dev를 확인해 주세요.");
  });
  req.on("aborted", () => upstream.destroy());
  req.pipe(upstream);
});

server.on("upgrade", (req, socket, head) => {
  if (!authorized(req)) { socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); return; }
  const upstream = request({ hostname: "127.0.0.1", port: targetPort, path: req.url, method: req.method, headers: headers(req) });
  upstream.on("upgrade", (response, remote, remoteHead) => {
    const lines = Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join("\r\n");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${lines}\r\n\r\n`);
    if (remoteHead.length) socket.write(remoteHead);
    if (head.length) remote.write(head);
    remote.on("error", () => socket.destroy());
    socket.on("error", () => remote.destroy());
    remote.pipe(socket).pipe(remote);
  });
  upstream.on("response", response => { socket.end(`HTTP/1.1 ${response.statusCode} Upgrade failed\r\nConnection: close\r\n\r\n`); response.resume(); });
  upstream.on("error", () => socket.destroy());
  upstream.end();
});

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  tunnel?.kill("SIGTERM");
  server.close();
  process.exit(code);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
server.on("error", error => { console.error(`Mobile gateway: ${error.code}`); stop(1); });

try {
  await fetch(`http://127.0.0.1:${targetPort}/chat`, { signal: AbortSignal.timeout(10_000) });
} catch {
  console.error("먼저 npm run dev로 AURAI 개발 서버를 실행해 주세요.");
  process.exit(1);
}
server.listen(gatewayPort, "127.0.0.1", async () => {
  // Fail closed: verify the gate locally before opening any external tunnel.
  try {
    const origin = `http://127.0.0.1:${gatewayPort}`;
    const probe = (path, options = {}) => fetch(`${origin}${path}`, { ...options, signal: AbortSignal.timeout(15_000) });
    const unauthorized = await probe("/chat");
    const wrongPassword = await probe("/chat", { headers: { Authorization: `Basic ${Buffer.from("aurai:incorrect").toString("base64")}` } });
    const unauthorizedApi = await probe("/api/skin-analysis", { method: "POST", headers: { Authorization: "Bearer invalid-test-token", "Content-Type": "application/json" }, body: "{}" });
    if ([unauthorized, wrongPassword, unauthorizedApi].some(response => response.status !== 401)) throw new Error("unauthorized access accepted");
    const authorizedPage = await probe("/chat", { headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` } });
    const sessionCookie = authorizedPage.headers.getSetCookie().find(value => value.startsWith(`${cookieName}=`));
    if (authorizedPage.status !== 200 || !sessionCookie?.includes("HttpOnly; Secure; SameSite=Lax")) throw new Error("authorized session unavailable");
    const cookiePage = await probe("/chat", { headers: { Cookie: sessionCookie.split(";")[0] } });
    if (cookiePage.status !== 200) throw new Error("cookie session unavailable");
    console.log("암호 보호 확인 완료: 무인증·잘못된 암호·무인증 API 차단, 올바른 암호·세션 통과.");
  } catch (error) {
    console.error(`암호 보호 검증 실패로 외부 터널을 열지 않았습니다: ${error.message}`);
    stop(1);
    return;
  }
  tunnel = spawn(binary, ["tunnel", "--url", `http://127.0.0.1:${gatewayPort}`, "--protocol", "http2", "--no-autoupdate"], { stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  let reported = false;
  const report = chunk => {
    output = (output + chunk.toString()).slice(-16_000);
    const url = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
    if (!url || reported) return;
    reported = true;
    if (!existsSync(".data")) mkdirSync(".data", { mode: 0o700 });
    writeFileSync(".data/mobile-dev.json", JSON.stringify({ url, username, password }), { mode: 0o600 });
    console.log(`모바일 테스트: ${url}/chat\n접속 이름: ${username}\n접속 암호: ${password}\n이 프로세스가 실행되는 동안만 주소가 유지됩니다.`);
  };
  tunnel.stdout.on("data", report);
  tunnel.stderr.on("data", report);
  tunnel.on("error", () => { console.error("cloudflared를 찾지 못했어요. CLOUDFLARED_BIN에 설치 경로를 지정해 주세요."); stop(1); });
  tunnel.on("exit", code => { if (!stopping) { console.error("모바일 HTTPS 연결이 종료됐어요."); stop(code || 1); } });
});
