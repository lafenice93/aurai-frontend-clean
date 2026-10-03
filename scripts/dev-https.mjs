// 폰에서 카메라를 쓰려면 보안 컨텍스트(HTTPS)가 필요하다.
// next dev/start 앞에 HTTPS를 씌워주는 개발용 프록시.
import { createServer } from "node:https";
import { request } from "node:http";
import { readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";

const TARGET_PORT = Number(process.env.TARGET_PORT || 3001);
const PORT = Number(process.env.HTTPS_PORT || 3443);

const options = {
  key: readFileSync("certificates/dev-key.pem"),
  cert: readFileSync("certificates/dev-cert.pem"),
};

function forward(req, res) {
  const proxied = request(
    {
      host: "127.0.0.1",
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (upstream) => {
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(res);
    },
  );

  proxied.on("error", (error) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`프록시 대상(:${TARGET_PORT})에 연결할 수 없습니다.\n${error.message}`);
  });

  req.pipe(proxied);
}

const server = createServer(options, forward);

// HMR 웹소켓 업그레이드도 그대로 넘긴다.
server.on("upgrade", (req, socket, head) => {
  const proxied = request({
    host: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });

  proxied.on("upgrade", (upstreamRes, upstreamSocket, upstreamHead) => {
    const headers = Object.entries(upstreamRes.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");

    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${headers}\r\n\r\n`);
    if (upstreamHead?.length) socket.unshift(upstreamHead);
    upstreamSocket.pipe(socket).pipe(upstreamSocket);
  });

  proxied.on("error", () => socket.destroy());
  if (head?.length) proxied.write(head);
  proxied.end();
});

function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

server.listen(PORT, () => {
  console.log(`HTTPS  -> http://127.0.0.1:${TARGET_PORT}`);
  console.log(`  Local:    https://localhost:${PORT}/chat`);
  console.log(`  Network:  https://${lanAddress()}:${PORT}/chat`);
});
