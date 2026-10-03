// [Backend 공통] 인식된 제품의 "브랜드가 정한" 제품 사진.
// POST: OpenAI 웹 검색으로 공식 제품 페이지의 패키지 이미지를 찾고, 서버가 직접 받아 검증한 뒤 메모리에 보관.
// GET ?k=: 보관한 이미지를 그대로 서빙 (외부 URL을 프록시하지 않는다 — 서버가 이미 받아 둔 바이트만 낸다).
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ProductImageRequestSchema, type ProductImageResult } from "@/app/lib/schemas/productImage";

const MODEL = "gpt-5.1";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_LIMIT = 200;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

const FoundSchema = z.object({
  imageUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
});

const INSTRUCTIONS = `Find the official product photo for a cosmetic or skincare product.
Search the web. Prefer, in order: (1) the brand's official website product page, (2) the brand's official store on a major retailer (Olive Young, Sephora, Amazon brand store, Hwahae, Musinsa), (3) a major beauty retailer's product page.
Return sourceUrl = the URL of that product page (always return it when you find the exact product's page, even if you cannot pick an image URL).
Return imageUrl = a direct https URL to the product packshot image on that page (jpg, jpeg, png or webp — the file itself, not an HTML page), ideally the main product image on a plain background, or null if you are not sure of the exact file URL. Never guess or construct an image URL.
If you cannot find this exact product at all, return null for both.`;

type Entry = {
  bytes: Buffer | null;
  contentType: string | null;
  sourceUrl: string | null;
  createdAt: number;
};

// 프로세스 메모리 캐시. 재시작하면 비워진다(제품 DB가 생기면 거기로 옮긴다).
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry>>();

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.info("[product-image]", ...args);
  }
};

function keyOf(brand: string | null, productName: string | null) {
  const normalized = `${brand ?? ""}|${productName ?? ""}`.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha1").update(normalized).digest("hex").slice(0, 24);
}

function remember(key: string, entry: Entry) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, entry);
  return entry;
}

// 모델이 준 URL을 서버가 직접 받아 진짜 이미지인지 확인한다.
async function download(url: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // Shopify 등은 og:image를 http://로 내놓는다. CDN은 https를 받으니 올려서 요청한다.
  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }
  if (parsed.protocol !== "https:") {
    return null;
  }

  try {
    const response = await fetch(parsed, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA, Accept: "image/*" },
      redirect: "follow",
    });
    const contentType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!response.ok || !/^image\/(jpeg|png|webp|avif)$/.test(contentType)) {
      devLog("download rejected", { status: response.status, contentType });
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      devLog("download size rejected", { bytes: bytes.length });
      return null;
    }
    return { bytes, contentType };
  } catch (error) {
    devLog("download failed", error instanceof Error ? error.message : error);
    return null;
  }
}

// 공식 패키지 사진은 대개 흰 배경 위 제품이다. 흰 배경을 투명하게 걷어내고 여백을 잘라
// 제품만 남긴 PNG로 만든다 → 카드의 따뜻한 타일 위에 제품이 놓인 것처럼 보인다.
// 배경이 흰색이 아닌 사진(연출컷)은 거의 바뀌지 않는다. 실패하면 원본을 그대로 쓴다.
const PACKSHOT_EDGE = 640;
async function packshot(bytes: Buffer, contentType: string): Promise<{ bytes: Buffer; contentType: string }> {
  try {
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const whiteAt = (p: number) => Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);

    // 가장자리와 이어진 흰 영역만 배경으로 본다(flood fill). 흰 용기(라메르 크림 등) 안쪽의 흰색은 남긴다.
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];
    const push = (p: number) => {
      if (!visited[p] && whiteAt(p) >= 205) {
        visited[p] = 1;
        queue.push(p);
      }
    };
    for (let x = 0; x < width; x++) {
      push(x);
      push((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      push(y * width);
      push(y * width + width - 1);
    }
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head];
      const x = p % width;
      if (x > 0) push(p - 1);
      if (x < width - 1) push(p + 1);
      if (p >= width) push(p - width);
      if (p < (height - 1) * width) push(p + width);
    }
    // 흰색(≥235)은 투명, 205~235는 부드럽게 반투명 — 가장자리 계단을 줄인다.
    for (let p = 0; p < width * height; p++) {
      if (!visited[p]) continue;
      const white = whiteAt(p);
      const alpha = white >= 235 ? 0 : Math.round(((235 - white) / 30) * 255);
      data[p * 4 + 3] = Math.min(data[p * 4 + 3], alpha);
    }
    const trimmed = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 10 });
    const meta = await trimmed.clone().toBuffer({ resolveWithObject: true });
    // 거의 다 지워졌으면(전체가 흰 이미지 등) 원본 유지.
    if (meta.info.width < 24 || meta.info.height < 24) {
      return { bytes, contentType };
    }
    const out = await trimmed
      .resize(PACKSHOT_EDGE, PACKSHOT_EDGE, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();
    return { bytes: out, contentType: "image/png" };
  } catch (error) {
    devLog("packshot processing failed", error instanceof Error ? error.message : error);
    return { bytes, contentType };
  }
}

// <script type="application/ld+json"> 안의 Product.image 전부(여러 장이면 순서대로).
function jsonLdProductImages(html: string): string[] {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const images = (value: unknown): string[] => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(images);
    if (value && typeof value === "object" && "url" in value) return images((value as { url: unknown }).url);
    return [];
  };
  const findProduct = (node: unknown): string[] => {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(findProduct);
    const record = node as Record<string, unknown>;
    const type = record["@type"];
    const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
    if (isProduct) return images(record.image);
    return findProduct(record["@graph"]);
  };

  const found: string[] = [];
  for (const match of scripts) {
    try {
      found.push(...findProduct(JSON.parse(match[1])));
    } catch {
      // 깨진 JSON-LD는 건너뛴다.
    }
  }
  return found;
}

// 제품 페이지에서 이미지 후보를 모은다: JSON-LD Product.image(들) → og:image → twitter:image.
async function pageImageCandidates(pageUrl: string): Promise<string[]> {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    return [];
  }
  if (parsed.protocol !== "https:") {
    return [];
  }

  try {
    const response = await fetch(parsed, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!response.ok) {
      devLog("page fetch rejected", { status: response.status, url: pageUrl });
      return [];
    }
    const html = (await response.text()).slice(0, 1_000_000);
    const base = response.url || parsed;
    const resolve = (raw: string) => {
      try {
        return new URL(raw.replace(/&amp;/g, "&"), base).toString();
      } catch {
        return null;
      }
    };

    const candidates = jsonLdProductImages(html).map(resolve);
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match?.[1]) candidates.push(resolve(match[1]));
    }
    const unique = [...new Set(candidates.filter((url): url is string => Boolean(url)))];
    devLog("page candidates", { count: unique.length, first: unique[0] ?? null });
    return unique;
  } catch (error) {
    devLog("page fetch failed", error instanceof Error ? error.message : error);
    return [];
  }
}

// 패키지컷 판별: 네 귀퉁이가 흰색이면 흰 배경 위 제품 사진일 가능성이 높다. 배너·연출컷은 대개 아니다.
async function looksLikePackshot(bytes: Buffer): Promise<boolean> {
  try {
    const { data, info } = await sharp(bytes).resize(64, 64, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const corners = [0, info.width - 1, (info.height - 1) * info.width, info.width * info.height - 1];
    const white = corners.filter((p) => Math.min(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]) >= 235).length;
    return white >= 3;
  } catch {
    return false;
  }
}

// 후보를 차례로 받아 보며 패키지컷을 먼저 고른다. 없으면 받아진 첫 이미지.
async function pickImage(candidates: string[], limit = 5) {
  let fallback: { bytes: Buffer; contentType: string } | null = null;
  for (const url of candidates.slice(0, limit)) {
    const image = await download(url);
    if (!image) continue;
    if (await looksLikePackshot(image.bytes)) {
      devLog("picked packshot", { url });
      return image;
    }
    fallback ??= image;
  }
  if (fallback) devLog("picked fallback (no white-background candidate)");
  return fallback;
}

async function lookup(brand: string | null, productName: string | null): Promise<Entry> {
  const client = new OpenAI();
  const query = [brand, productName].filter(Boolean).join(" ");
  const startedAt = Date.now();

  const response = await client.responses.parse({
    model: MODEL,
    instructions: INSTRUCTIONS,
    tools: [{ type: "web_search" }],
    input: [{ role: "user", content: [{ type: "input_text", text: `Product: ${query}` }] }],
    text: { format: zodTextFormat(FoundSchema, "product_image") },
  });

  const found = response.output_parsed;
  devLog("search", { query, ms: Date.now() - startedAt, imageUrl: found?.imageUrl ?? null, sourceUrl: found?.sourceUrl ?? null });

  const sourceUrl = found?.sourceUrl ?? null;
  // 후보: 모델이 준 이미지 URL + 제품 페이지의 JSON-LD/og 이미지들. 흰 배경 패키지컷을 우선한다.
  const candidates = [
    ...(found?.imageUrl ? [found.imageUrl] : []),
    ...(sourceUrl ? await pageImageCandidates(sourceUrl) : []),
  ];
  const image = await pickImage(candidates);

  const processed = image ? await packshot(image.bytes, image.contentType) : null;
  devLog("result", {
    query,
    found: Boolean(image),
    bytes: processed?.bytes.length ?? 0,
    contentType: processed?.contentType ?? null,
  });
  return {
    bytes: processed?.bytes ?? null,
    contentType: processed?.contentType ?? null,
    sourceUrl,
    createdAt: Date.now(),
  };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const body = ProductImageRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success || (!body.data.brand && !body.data.productName)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { brand, productName } = body.data;
  const key = keyOf(brand, productName);

  let entry = cache.get(key);
  if (!entry) {
    // 같은 제품이 카드 4장에서 동시에 요청돼도 검색은 한 번만.
    let job = pending.get(key);
    if (!job) {
      job = lookup(brand, productName)
        .then((made) => remember(key, made))
        .catch((error) => {
          console.error("[product-image] lookup error", error instanceof Error ? error.message : error);
          return remember(key, { bytes: null, contentType: null, sourceUrl: null, createdAt: Date.now() });
        })
        .finally(() => pending.delete(key));
      pending.set(key, job);
    }
    entry = await job;
  }

  const result: ProductImageResult = {
    imageUrl: entry.bytes ? `/api/product-image?k=${key}` : null,
    sourceUrl: entry.sourceUrl,
  };
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("k") ?? "";
  const entry = cache.get(key);
  if (!entry?.bytes || !entry.contentType) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(entry.bytes), {
    headers: {
      "Content-Type": entry.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
