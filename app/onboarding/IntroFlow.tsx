"use client";

// [Web 전용] 온보딩 3단. 배경은 글자가 없는 인물 사진 한 장(public/onboarding/stage-bg.png)이고
// 로고·헤드라인·기능 3행·시작 버튼은 전부 독립된 DOM 레이어다. 참고 시안의 PNG를 겹치지 않는다.
//
// 위치와 크기는 941×1672 아트보드에서 실측한 값이다. 아트보드에 container-type을 걸고
// 글자 크기를 cqw로 적어, 폰이든 데스크톱이든 시안과 같은 비율로 커지고 작아진다.
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Stage from "@/app/components/onboarding/Stage";
import { Star, useReducedMotion } from "@/app/components/chat/Sparkle";
import { ScanIcon, ShieldCheckIcon, SparkleIcon } from "./icons";
import { ko } from "@/app/lib/locale/ko";

/** 941px 아트보드에서 1cqw = 9.41px. 실측 px을 그대로 적고 여기서 환산한다. */
const cq = (px: number) => `${(px / 9.41).toFixed(2)}cqw`;
/** 아트보드 기준 세로 % */
const vy = (px: number) => `${((px / 1672) * 100).toFixed(2)}%`;
/** 아트보드 기준 가로 % */
const vx = (px: number) => `${((px / 941) * 100).toFixed(2)}%`;

// 요소가 1초씩 밀려 나오므로, 마지막 요소가 다 나타난 뒤 읽을 시간까지 포함한 값이다.
// 1단: 헤드라인이 1초에 시작해 1.1초 동안 등장 → 2.1초. 2단: 3행 설명이 5초에 시작해 6.1초.
const STEP_HOLD_MS = [3600, 7600];

// 깨끗한 배경에서는 아래쪽 뺨·입술이 밝아 흰 글자 대비가 2.0~3.0까지 떨어진다.
// 세로로 단조롭게 짙어지는 따뜻한 스크림 한 겹으로 본문 4.5:1을 확보한다. 두 겹을 겹치면
// 중간에 안개 띠가 보이므로 한 겹만 쓰고, 단계를 촘촘히 둬서 경계가 생기지 않게 한다.
// 회색은 쓰지 않는다 — DESIGN.md 의 회색 금지 규칙.
const SCRIM =
  "linear-gradient(180deg," +
  " rgb(46 27 15 / 0) 0%, rgb(46 27 15 / 0.04) 30%," +
  " rgb(46 27 15 / 0.15) 45%, rgb(46 27 15 / 0.31) 54%," +
  " rgb(46 27 15 / 0.42) 62%, rgb(46 27 15 / 0.44) 78%," +
  " rgb(46 27 15 / 0.48) 100%)";

// 사진 위 글자의 테두리를 살려 주는 따뜻한 그림자. 스크림을 더 올리는 대신 이걸 쓴다.
const INK_SHADOW = "0 1px 10px rgb(46 27 15 / 0.5), 0 0 2px rgb(46 27 15 / 0.32)";

const FEATURE_ICONS = [ScanIcon, SparkleIcon, ShieldCheckIcon];

export default function IntroFlow() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [raw, setRaw] = useState(0);
  // 모션을 줄인 환경에서는 단계를 거치지 않고 모든 내용을 즉시 보여준다.
  const step = reduced ? 2 : raw;

  // 읽을 시간을 준 뒤 다음 단계로. 탭하면 기다리지 않고 바로 넘어간다.
  useEffect(() => {
    if (reduced || step >= 2) return;
    const timer = setTimeout(() => setRaw((s) => Math.min(2, s + 1)), STEP_HOLD_MS[step]);
    return () => clearTimeout(timer);
  }, [step, reduced]);

  const advance = useCallback(() => setRaw((s) => Math.min(2, s + 1)), []);

  return (
    <Stage>
      <div className="absolute inset-0" style={{ containerType: "inline-size" }}>
        <Image
          src="/onboarding/stage-bg.png"
          alt={ko.ONBOARDING_BG_ALT}
          fill
          priority
          sizes="430px"
          className="object-cover"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: SCRIM }}
        />

        {/* 1단: 로고 — 0초에 시작, 0.2초 동안 제자리에서 */}
        <div
          className="onb-hold absolute"
          style={{
            left: vx(55),
            top: vy(184.5),
            animationDelay: "0ms",
          }}
        >
          <p
            className="relative whitespace-nowrap leading-none"
            style={{
              fontSize: cq(80),
              letterSpacing: "0.19em",
              color: "var(--text-primary)",
              fontWeight: 300,
              textShadow: INK_SHADOW,
            }}
          >
            {ko.ONBOARDING_LOGO}
            {/* 마지막 I 위의 작은 반짝임. 시안 실측 중심 (35.18%, 11.03%) */}
            <Star
              size={3}
              style={{ left: "90.5%", top: "2%" }}
              rays={{ x: 16, y: 13 }}
              glowScale={0.8}
            />
          </p>
          <p
            className="whitespace-nowrap leading-none"
            style={{
              marginTop: cq(14.3),
              fontSize: cq(27),
              letterSpacing: "0.19em",
              color: "var(--text-primary)",
              opacity: 0.88,
              textShadow: INK_SHADOW,
            }}
          >
            {ko.ONBOARDING_LOGO_TAGLINE}
          </p>
        </div>

        {/* 1단: 헤드라인 — 0.3초부터 번지듯 올라온다 */}
        <div
          className="onb-rise absolute"
          style={{ left: vx(60), top: vy(470), animationDelay: "1000ms" }}
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 block"
            style={{
              width: "2px",
              height: cq(290),
              background:
                "linear-gradient(180deg, rgb(247 238 230 / 0.85), rgb(247 238 230 / 0.12))",
            }}
          />
          <Star
            size={4}
            style={{ left: "1px", top: cq(8) }}
            rays={{ x: 26, y: 34 }}
          />
          <div
            style={{
              marginLeft: cq(43),
              paddingTop: cq(43),
              fontSize: cq(56),
              lineHeight: 1.25,
              color: "var(--text-primary)",
              wordBreak: "keep-all",
              fontWeight: 300,
              textShadow: INK_SHADOW,
            }}
          >
            {ko.ONBOARDING_HEADLINE.map((line, index) => (
              <p key={line} className="whitespace-nowrap">
                {line}
                {index === ko.ONBOARDING_HEADLINE.length - 1 ? (
                  <strong style={{ fontWeight: 700 }}>
                    {ko.ONBOARDING_HEADLINE_EMPHASIS}
                  </strong>
                ) : null}
              </p>
            ))}
          </div>
        </div>

        {/* 2단: 기능 3행. 행마다 아이콘 → 제목 → 설명 순서로 0.1초씩 밀려 등장한다. */}
        {step >= 1
          ? ko.ONBOARDING_FEATURES.map((feature, row) => {
              const Icon = FEATURE_ICONS[row];
              const base = row * 1000; // 행 사이 1초 간격
              return (
                <div
                  key={feature.title}
                  className="absolute flex items-center"
                  style={{ left: vx(55), top: vy(1011 + row * 122), height: cq(88) }}
                >
                  <span
                    className="onb-hold flex shrink-0 items-center justify-center rounded-full"
                    style={{
                      width: cq(88),
                      height: cq(88),
                      animationDelay: `${base + 1000}ms`,
                      background:
                        "radial-gradient(circle at 50% 32%, rgb(255 236 214 / 0.17), rgb(255 219 188 / 0.05))",
                      border: "1px solid rgb(244 210 187 / 0.38)",
                      boxShadow: "inset 0 1px 0 rgb(255 241 222 / 0.20)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Icon size={cq(42)} />
                  </span>

                  <span
                    aria-hidden="true"
                    className="onb-hold shrink-0"
                    style={{
                      width: "1px",
                      height: cq(75),
                      marginLeft: cq(24),
                      marginRight: cq(23),
                      animationDelay: `${base + 1000}ms`,
                      background:
                        "linear-gradient(180deg, rgb(247 238 230 / 0.10), rgb(247 238 230 / 0.55), rgb(247 238 230 / 0.10))",
                    }}
                  />

                  <span className="flex min-w-0 flex-col justify-center">
                    <span
                      className="onb-drop whitespace-nowrap leading-none"
                      style={{
                        fontSize: cq(29),
                        color: "var(--text-primary)",
                        textShadow: INK_SHADOW,
                        animationDelay: `${base + 2000}ms`,
                      }}
                    >
                      {feature.title}
                    </span>
                    <span
                      className="onb-rise whitespace-nowrap leading-none"
                      style={{
                        marginTop: cq(12),
                        fontSize: cq(21),
                        color: "rgb(247 238 230 / 0.88)",
                        textShadow: INK_SHADOW,
                        animationDelay: `${base + 3000}ms`,
                      }}
                    >
                      {feature.desc}
                    </span>
                  </span>
                </div>
              );
            })
          : null}

        {/* 3단: 1초 알약+글로우+별빛, 2초 라벨+화살표, 3초 한 번 눌림, 그 뒤 조용한 부유.
            바깥 상자가 알약·못·별빛을 한꺼번에 띄우고, 안쪽 두 겹이 부유와 눌림을 나눠 맡는다. */}
        {step >= 2 ? (
          <div
            className="onb-hold absolute"
            style={{
              left: vx(139),
              top: vy(1466),
              width: vx(664),
              animationDelay: "1000ms",
            }}
          >
            {/* 알약 뒤에 깔리는 흐린 못. 시안의 버튼은 반투명 면이 배경을 밝혀서
                흰 라벨 대비가 2.2:1까지 떨어진다. 유리 느낌은 그대로 두고 뒤만 눌러
                라벨을 4.9:1로 올린다. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full"
              style={{
                inset: "-16% -4%",
                background: "rgb(46 27 15 / 0.22)",
                filter: "blur(12px)",
              }}
            />
            <div
              className={reduced ? undefined : "onb-float"}
              style={reduced ? undefined : { animationDelay: "3700ms" }}
            >
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="onb-press relative flex w-full cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7EEE6]"
                style={{
                  height: cq(110),
                  animationDelay: "3000ms",
                  background:
                    "linear-gradient(180deg, rgb(255 241 224 / 0.14) 0%, rgb(236 192 150 / 0.06) 100%)",
                  border: "1px solid rgb(244 210 187 / 0.72)",
                  boxShadow:
                    "0 0 2px 1px rgb(244 210 187 / 0.55), 0 0 22px 6px rgb(228 153 103 / 0.30), inset 0 1px 0 rgb(255 243 227 / 0.38)",
                  backdropFilter: "blur(3px)",
                  WebkitBackdropFilter: "blur(3px)",
                  color: "var(--text-primary)",
                }}
              >
                <span
                  className="onb-hold whitespace-nowrap leading-none"
                  style={{
                    fontSize: cq(25),
                    letterSpacing: "0.2em",
                    textShadow: INK_SHADOW,
                    animationDelay: "2000ms",
                  }}
                >
                  {ko.START_SKIN_SCAN}
                </span>
                <span
                  className="onb-hold absolute flex items-center"
                  style={{ right: "13%", animationDelay: "2000ms" }}
                  aria-hidden="true"
                >
                  <ArrowIcon size={cq(24)} />
                </span>

                {/* 외곽선에 앉은 별빛 두 점 */}
                <Star
                  size={3}
                  style={{ left: "4%", top: "18%" }}
                  rays={{ x: 14, y: 12 }}
                  glowScale={0.85}
                />
                <Star
                  size={3}
                  style={{ left: "88%", top: "92%" }}
                  rays={{ x: 16, y: 13 }}
                  glowScale={0.9}
                  startDelay={1100}
                />
              </button>
            </div>
          </div>
        ) : null}

        {/* 1·2단에서 다음 내용으로 넘기는 영역. 키보드로도 누를 수 있다. */}
        {step < 2 ? (
          <button
            type="button"
            onClick={advance}
            aria-label={ko.ONBOARDING_NEXT}
            className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#F7EEE6]"
          />
        ) : null}
      </div>
    </Stage>
  );
}

function ArrowIcon({ size }: { size: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
