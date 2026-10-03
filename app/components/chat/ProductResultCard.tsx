"use client";

// [Web 전용] "보유 제품 인식 결과" — 제품마다 작은 카드 한 장(왼쪽 사진 · 오른쪽 번호/이름/상세/액션), 카드 사이 ⌄.
// 사진은 브랜드 공식 제품 이미지를 먼저 찾아 넣고, 없으면 촬영 사진에서 잘라낸 crop, 그것도 없으면 자리표시.
// 크기는 인라인 style로 고정한다 — 유틸리티 CSS가 캐시 등으로 빠져도 카드가 커지지 않게.
import { Fragment, useEffect, useState } from "react";
import { lookupProductImage } from "@/app/lib/api/products";
import { cropThumbnails } from "@/app/lib/camera/capture";
import { ko } from "@/app/lib/locale/ko";
import { traceStep } from "@/app/lib/products/diagnostics";
import { recognitionStatus } from "@/app/lib/products/recognition";
import type {
  ProductRecognitionResult,
  RecognizedProduct,
} from "@/app/lib/schemas/productRecognition";

const THUMB = { width: 112, height: 96 };

function BottleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2.5h5v3.2l1.6 2.1a2 2 0 0 1 .4 1.2V19a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 7.5 19V9a2 2 0 0 1 .4-1.2l1.6-2.1Z" />
      <path d="M8.5 12.5h7" />
      <path d="M8.5 16.5h7" />
    </svg>
  );
}

function Chevron() {
  return (
    <li aria-hidden="true" className="flex justify-center text-[#F7EEE6]/45" style={{ padding: "2px 0" }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </li>
  );
}

type Row = RecognizedProduct & { confirmed: boolean };

/** 카드에 쓸 이미지. official이 있으면 그것, 없으면 촬영 crop. */
export type ProductImage = { url: string; kind: "official" | "crop" } | null;

// 제목은 "브랜드 카테고리"(예: 아누아 앰플), 부제는 패키지의 제품명 전체.
function titleOf(product: RecognizedProduct) {
  const title = [product.brand, product.category].filter(Boolean).join(" ");
  return title || ko.PRODUCTS_UNKNOWN_TITLE;
}

function ProductRow({
  index,
  product,
  image,
  onChange,
  onDelete,
  onAnalyze,
}: {
  index: number;
  product: Row;
  image: ProductImage;
  onChange: (next: Row) => void;
  onDelete: () => void;
  onAnalyze?: (product: RecognizedProduct, image: ProductImage) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState(product.brand ?? "");
  const [name, setName] = useState(product.productName ?? "");
  const status = recognitionStatus(product);

  function save() {
    onChange({
      ...product,
      brand: brand.trim() || null,
      productName: name.trim() || null,
      // 사용자가 직접 적은 값은 확정으로 본다.
      confidence: 1,
      needsReview: false,
      confirmed: true,
    });
    setEditing(false);
  }

  const inputStyle = { border: "1px solid var(--bubble-stroke)" };
  const inputClass =
    "w-full rounded-[8px] bg-transparent px-2 py-1 text-[12px] text-[#F7EEE6] placeholder:text-[#F7EEE6]/40 focus:outline-none";
  const linkClass = "cursor-pointer underline underline-offset-2";

  return (
    <li
      className="flex"
      style={{
        gap: 12,
        padding: 10,
        borderRadius: 14,
        background: "var(--bubble-fill)",
        border: "1px solid var(--bubble-stroke)",
      }}
      data-testid="product-row"
      data-status={status}
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: THUMB.width,
          height: THUMB.height,
          borderRadius: 10,
          // 목업의 베이지 연출 배경 느낌: 위는 밝고 아래로 갈수록 바닥처럼 어두워진다.
          background:
            "radial-gradient(ellipse 80% 55% at 50% 30%, rgb(255 236 214 / 0.55), transparent 70%), linear-gradient(180deg, #D9B896 0%, #C39B74 60%, #A77E5A 100%)",
          border: "1px solid rgb(255 225 195 / 0.22)",
        }}
        data-image-kind={image?.kind ?? "none"}
      >
        {image ? (
          // 공식 패키지컷(배경 제거된 PNG)은 타일 위에 제품이 놓인 것처럼 contain + 그림자,
          // 촬영 crop은 타일을 가득 채우는 cover.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt=""
            style={
              image.kind === "official"
                ? {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 8,
                    filter: "drop-shadow(0 6px 10px rgb(60 30 10 / 0.35))",
                  }
                : { width: "100%", height: "100%", objectFit: "cover" }
            }
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#F0DCC6]/70">
            <BottleIcon />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 4 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center rounded-full text-[#F7EEE6]/90"
            style={{
              width: 22,
              height: 22,
              fontSize: 11,
              background: "rgb(255 233 210 / 0.16)",
              border: "1px solid var(--bubble-stroke)",
            }}
          >
            {index + 1}
          </span>
          {editing ? (
            <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder={ko.PRODUCT_BRAND_PLACEHOLDER} aria-label={ko.PRODUCT_BRAND_PLACEHOLDER} className={inputClass} style={inputStyle} />
          ) : (
            <p className="truncate text-[14px] leading-tight text-[#F7EEE6]">{titleOf(product)}</p>
          )}
        </div>

        {editing ? (
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={ko.PRODUCT_NAME_PLACEHOLDER} aria-label={ko.PRODUCT_NAME_PLACEHOLDER} className={inputClass} style={inputStyle} />
        ) : (
          <p
            className="text-[11px] leading-[1.4] text-[#F7EEE6]/70"
            style={{
              wordBreak: "keep-all",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.productName ||
              (product.visibleText.length > 0 ? product.visibleText.join(" ") : ko.PRODUCTS_UNNAMED)}
          </p>
        )}

        <div className="mt-auto flex items-center text-[11px]" style={{ gap: 10, paddingTop: 2 }}>
          {editing ? (
            <button type="button" onClick={save} className={`${linkClass} text-[#F0DCC6]`}>
              {ko.PRODUCT_SAVE}
            </button>
          ) : (
            <>
              {product.confirmed ? (
                <span className="text-[#F0DCC6]/80">{ko.PRODUCT_CONFIRMED}</span>
              ) : status !== "insufficient" ? (
                <button type="button" onClick={() => onChange({ ...product, confirmed: true })} className={`${linkClass} text-[#F0DCC6]`}>
                  {ko.PRODUCT_CONFIRM}
                </button>
              ) : null}
              <button type="button" onClick={() => setEditing(true)} className={`${linkClass} text-[#F7EEE6]/70`}>
                {ko.PRODUCT_EDIT}
              </button>
              <button type="button" onClick={onDelete} className={`${linkClass} text-[#F7EEE6]/50`}>
                {ko.PRODUCT_DELETE}
              </button>
              {/* 브랜드/제품명이 읽힌 제품만 성분·궁합 분석으로 넘길 수 있다. */}
              {onAnalyze && status !== "insufficient" ? (
                <button
                  type="button"
                  onClick={() => onAnalyze(product, image)}
                  data-testid="product-analyze"
                  className="ml-auto cursor-pointer rounded-full text-[#3B2418]"
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    background: "linear-gradient(180deg, #F6E3CF 0%, var(--accent) 100%)",
                    border: "1px solid var(--gold-line)",
                  }}
                >
                  {ko.PRODUCT_ANALYZE} ›
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ProductResultCard({
  result,
  photo,
  onAnalyze,
}: {
  result: ProductRecognitionResult;
  /** 원본 촬영 사진. 공식 이미지를 못 찾은 제품의 썸네일을 여기서 잘라낸다. */
  photo: Blob | null;
  /** "분석 보기" — 제품과 카드에 쓰인 이미지를 넘긴다. */
  onAnalyze?: (product: RecognizedProduct, image: ProductImage) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    result.products.map((product) => ({ ...product, confirmed: false })),
  );
  const [crops, setCrops] = useState<Record<string, string>>({});
  const [official, setOfficial] = useState<Record<string, string>>({});

  // 카드가 실제로 화면에 붙었는지(React state → DOM) 확인용.
  useEffect(() => {
    traceStep("ui-updated", { rendered: "product-card", rows: result.products.length });
  }, [result.products.length]);

  // 촬영 사진 crop — 공식 이미지가 오기 전(또는 못 찾았을 때) 쓰는 썸네일.
  useEffect(() => {
    if (!photo) {
      return;
    }
    let cancelled = false;
    let urls: (string | null)[] = [];

    cropThumbnails(photo, result.products.map((product) => product.box))
      .then((made) => {
        urls = made;
        if (cancelled) return;
        const next: Record<string, string> = {};
        result.products.forEach((product, index) => {
          const url = made[index];
          if (url) next[product.tempId] = url;
        });
        setCrops(next);
      })
      .catch((error) => console.warn("[product-analysis] thumbnail crop failed", error));

    return () => {
      cancelled = true;
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [photo, result.products]);

  // 브랜드 공식 제품 이미지 — 정체가 읽힌 제품만, 제품마다 병렬로.
  useEffect(() => {
    let cancelled = false;
    result.products
      .filter((product) => product.brand || product.productName)
      .forEach((product) => {
        lookupProductImage({ brand: product.brand, productName: product.productName }).then((found) => {
          if (cancelled || !found.imageUrl) return;
          setOfficial((current) => ({ ...current, [product.tempId]: found.imageUrl as string }));
        });
      });
    return () => {
      cancelled = true;
    };
  }, [result.products]);

  const imageFor = (id: string): ProductImage =>
    official[id] ? { url: official[id], kind: "official" } : crops[id] ? { url: crops[id], kind: "crop" } : null;

  return (
    <section
      className="rounded-[18px]"
      style={{
        padding: "14px 12px",
        background: "var(--bubble-fill)",
        border: "1.3px solid var(--bubble-stroke)",
      }}
      data-testid="product-results"
    >
      <p className="text-[13px] text-[#F7EEE6]/85" style={{ padding: "0 4px 10px" }}>
        {ko.PRODUCTS_TITLE}
      </p>

      <ul className="flex flex-col" style={{ gap: 2 }}>
        {rows.map((row, index) => (
          <Fragment key={row.tempId}>
            {index > 0 ? <Chevron /> : null}
            <ProductRow
              index={index}
              product={row}
              image={imageFor(row.tempId)}
              onChange={(next) =>
                setRows((current) => current.map((item) => (item.tempId === next.tempId ? next : item)))
              }
              onDelete={() => setRows((current) => current.filter((item) => item.tempId !== row.tempId))}
              onAnalyze={onAnalyze}
            />
          </Fragment>
        ))}
      </ul>
    </section>
  );
}
