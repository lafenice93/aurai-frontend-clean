# AURAI Design Tokens

이 문서는 [app/globals.css](../app/globals.css) 에 실제로 들어 있는 토큰의 목록입니다.
**색·타이포·깊이를 어떻게 써야 하는지는 [DESIGN.md](../DESIGN.md) 가 정합니다.**
이 문서는 값의 재고표이고, DESIGN.md 가 규칙입니다. 둘이 어긋나면 DESIGN.md 가 맞습니다.

토큰을 바꾸면 이 문서와 `globals.css` 를 함께 고치세요.

## 1. Color

색은 전부 `:root` 의 CSS 변수입니다. `@theme` 에는 색을 두지 않습니다 — 범용 팔레트를
Tailwind 유틸리티로 열어두면 새 화면이 브론즈 세계 밖의 색을 집기 때문입니다.

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--bg` | `linear-gradient(180deg, #a27251, #a2704c 36%, #936343 54%, #825539 72%, #744a30 87%, #6a432b)` | 모든 화면의 바탕 |
| `--bg-glow` | `radial-gradient(ellipse 70% 40% at 50% 35%, rgb(176 124 86 / 0.35), transparent 70%)` | 상단 세이프라이트 한 겹 |
| `--bubble-fill` | `rgb(245 178 138 / 0.15)` | 말풍선·카드·칩의 면 |
| `--bubble-stroke` | `rgb(245 176 121 / 0.37)` | 모든 1px 경계 |
| `--text-primary` | `#f7eee6` | 본문 글자 |
| `--icon-color` | `#f8ede4` | 순수 아이콘 |
| `--ui-ivory` | `#f5f1e1` | 입력 바 글자·아이콘·포커스 링 |
| `--accent` | `#e8b98a` | 라디오·불릿·주요 행동 칩 |
| `--gold-line` | `#f4d2bb` | 선택·확정 테두리 |
| `--sparkle-core` | `#fdf6f1` | 반짝임의 핵 |
| `--warm` | `255, 215, 175` | 입력 바용 rgb 삼원값 |
| `--field-tint` | `240, 228, 225` | 입력 필드용 rgb 삼원값 |
| `--background` / `--foreground` | `#ffffff` / `#171717` | 토큰을 안 쓰는 화면의 body 기본값 |

회색 스케일, 오렌지 `prime-*` 팔레트, 상태 색(success/warning/error/info)은 이 세계가
쓰지 않아 제거했습니다. 되살리지 마세요 — 이유는 DESIGN.md 의 Don'ts 에 있습니다.

## 2. Typography

- **Body**: `--body-font` = `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Mono**: 없음. mono 를 쓰는 화면이 없어 토큰을 두지 않습니다.

Pretendard Variable 은 직접 호스팅합니다. `public/fonts/PretendardVariable.subset.woff2`
(457 KB) 를 `globals.css` 의 `@font-face` 로 등록하고, [app/layout.tsx](../app/layout.tsx)
에서 `ReactDOM.preload` 로 미리 받습니다. 가변 축이 `font-weight: 45 920` 이라 300~700
구간을 이 한 파일로 전부 씁니다.

서브셋에는 KS X 1001 상용 한글 2,350자와 라틴·문장부호만 있습니다(원본 전체는 한글
11,172자에 2,009 KB). 상용자 밖의 희귀 음절은 위 폴백 체인의 기기 한글 폰트로 그려집니다.
다시 만들거나 전체 한글로 바꾸려면
[scripts/build-pretendard-subset.py](../scripts/build-pretendard-subset.py) 를 쓰세요.
라이선스는 SIL OFL 1.1 — `public/fonts/OFL.txt`.

`@theme` 의 스케일:

| 토큰 | 값 | | 토큰 | 값 |
| --- | --- | --- | --- | --- |
| `--text-xs` | 12px | | `--text-xl` | 20px |
| `--text-sm` | 14px | | `--text-2xl` | 24px |
| `--text-base` | 16px | | `--text-3xl` | 32px |
| `--text-lg` | 18px | | | |

Weights: light 300 / normal 400 / medium 500 / semibold 600 / bold 700
Line heights: tight 1.2 / normal 1.5 / relaxed 1.75 / loose 2

실제 화면이 쓰는 크기는 10~17px 과 22px, 40px 입니다. 위 스케일의 `text-xs`·`text-sm`
외에는 대부분 `text-[15px]` 처럼 임의값으로 직접 적습니다. 역할별 위계는 DESIGN.md 의
Typography 를 보세요.

## 3. Spacing

4px 단위 Tailwind 기본 스케일을 그대로 씁니다(`p-1` ~ `p-16`). 추가 토큰:

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--gutter` | 16px | 좌우 여백 |
| `--avatar-size` | 32px | AI 아바타 |
| `--avatar-bubble-gap` | 8px | 아바타와 말풍선 사이 |
| `--bubble-padding` | 18px 20px | 한 문장 말풍선 |
| `--bubble-padding-multi` | 28px 20px | 여러 문장 말풍선 |

## 4. Border Radius

`none 0` / `sm 4px` / `md 8px` / `lg 12px` / `xl 16px` / `2xl 24px` / `full 9999px`

별도로 `--bubble-radius: 16px` 이 있습니다. 실제 화면은 8/10/12/14/16/18px 과 알약을
쓰며 대부분 임의값입니다. `none` 은 쓰이지 않습니다.

## 5. Shadows

범용 그림자 스케일은 없습니다. 깊이는 반투명도와 1px 선, 그리고 글로우로 만듭니다.

| 토큰 | 용도 |
| --- | --- |
| `--gold-glow` | 선택·신호·확정. 바깥 3겹 + inset 1겹 |
| `--sparkle-glow` | ✦ 문자와 별의 발광 |

전체 그림자 어휘(구슬 부피, 입력 필드 함몰, 제품컷 접지)는
[.impeccable/design.json](../.impeccable/design.json) 의 `extensions.shadows` 에 있습니다.

## 6. Transitions

`--transition-fast: 150ms` / `--transition-base: 200ms` / `--transition-slow: 300ms`,
모두 `ease-in-out`.

컴포넌트는 지금 이 변수를 직접 참조하지 않고 같은 값의 Tailwind 유틸리티
(`duration-150 ease-out` 등)를 씁니다. 등장·신호 애니메이션의 타이밍 상수는
[app/lib/reveal.ts](../app/lib/reveal.ts) 가 단일 출처입니다.

## 7. Z-Index Scale

`dropdown 1000` / `sticky 1020` / `fixed 1030` / `modal-backdrop 1040` /
`modal 1050` / `popover 1060` / `tooltip 1070`

Tailwind 유틸리티가 아닌 일반 CSS 변수이므로 `z-[var(--z-modal)]` 로 씁니다.
아직 쓰는 곳은 없습니다 — 드롭다운·모달이 생기면 이 스케일을 쓰세요.

## 8. Breakpoints

없습니다. 모든 화면이 `max-width: 430px` 단일 컬럼 폰 프레임이라 반응형 분기가 없어
브레이크포인트 토큰을 제거했습니다. Tailwind 기본값(`sm 640` …)이 그대로 유효하지만
쓰지 않습니다. 넓은 화면 레이아웃이 필요해지면 그때 다시 정하세요.

## 9. Dark Mode

`prefers-color-scheme: dark` 에서 `--background` 와 `--foreground` 만 반전됩니다.
브론즈 화면은 `--bg` 를 직접 쓰므로 다크 모드와 무관합니다 — 즉 반전되는 것은 토큰을
쓰지 않는 화면의 body 기본값뿐입니다.

---

**Last Updated**: 2026-10-01
**Version**: 2.0 — 미사용 토큰 제거, Pretendard 자체 호스팅, DESIGN.md 로 권한 이전
