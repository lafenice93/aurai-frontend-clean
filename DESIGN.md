---
name: AURAI
description: 어둔 브론즈 암실에서 초상이 번짐을 벗고 드러나는 한 손 스킨케어 대화
colors:
  developer-bronze-surface: "#a27251"
  developer-bronze-floor: "#6a432b"
  safelight-glow: "rgb(176 124 86 / 0.35)"
  emulsion-fill: "rgb(245 178 138 / 0.15)"
  emulsion-stroke: "rgb(245 176 121 / 0.37)"
  developing-line: "#f4d2bb"
  highlight-amber: "#e8b98a"
  print-ivory: "#f7eee6"
  control-ivory: "#f5f1e1"
  icon-ivory: "#f8ede4"
  silver-grain: "#fdf6f1"
  tray-shadow: "#865a3d"
  ink-brown: "#3b2418"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  field: "8px"
  thumb: "10px"
  chip: "12px"
  row: "14px"
  bubble: "16px"
  card: "18px"
  full: "9999px"
spacing:
  gutter: "16px"
  avatar-gap: "8px"
  stack: "10px"
  bubble-pad: "18px 20px"
  bubble-pad-multi: "28px 20px"
components:
  bubble-assistant:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "{spacing.bubble-pad}"
  bubble-user:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "{spacing.bubble-pad}"
    width: "78%"
  chip-quick:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    rounded: "{rounded.chip}"
    padding: "10px 16px"
  chip-action-primary:
    backgroundColor: "{colors.highlight-amber}"
    textColor: "{colors.ink-brown}"
    rounded: "{rounded.chip}"
    padding: "10px 16px"
  choice-card:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    rounded: "{rounded.card}"
    padding: "0 16px 0 0"
  choice-card-selected:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    rounded: "{rounded.card}"
  recommend-card:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
  input-bar:
    textColor: "{colors.control-ivory}"
    rounded: "{rounded.full}"
    height: "48px"
    width: "336px"
    padding: "0 6px"
  button-send:
    textColor: "{colors.control-ivory}"
    rounded: "{rounded.full}"
    size: "36px"
  product-row:
    backgroundColor: "{colors.emulsion-fill}"
    textColor: "{colors.print-ivory}"
    rounded: "{rounded.row}"
    padding: "10px"
---

# Design System: AURAI

## Overview

**Creative North Star: "현상되는 초상"**

AURAI의 모든 화면은 어둔 브론즈 암실이다. 위에서 아래로 짙어지는 구리빛 현상액 위에 반투명한 감광 패널이 떠 있고, 그 안에서 글자와 카드가 `blur(16px)`의 번짐을 벗으며 한 단어씩 드러난다. 이것이 이 시스템의 단 하나의 서명이다. 아무것도 미끄러져 들어오거나 튀어오르지 않는다. 안 보이던 것이 보이게 될 뿐이다. 제품도 피부도 사진으로 읽는 제품의 기제가 그대로 화면의 은유가 된다.

리듬은 일부러 늦다. 한 단어에 80ms, 한 문장에 2초, 다음 말풍선까지 또 2초. 사용자를 재촉하지 않고 상담처럼 기다려 준다. 그 느린 화면이 죽어 보이지 않는 이유는 가만히 있는 순간이 없기 때문이다. 별이 무작위로 반짝이고, 테두리를 글림트가 지나가고, 보내기 버튼의 오로라 링이 12초에 한 바퀴 돈다. 숨 쉬는 정적이다.

내밀하다. 밝은 화면이 아니라 밤에 혼자 보는 화면이고, 어둔 봉 위에 놓인 아이보리 글자는 소리내 읽히기보다 눈으로만 읽힌다. 컨트롤은 기본 상태에서 수줍게 물러나 있다가, 차례가 오거나 사용자가 고르면 금빛 테두리가 켜진다. 빛은 장식이 아니라 대답이다.

**Key Characteristics:**
- 브론즈 현상액 그라디언트 한 장이 모든 화면의 바탕이며, 화면마다 배경을 새로 정하지 않는다.
- 모든 등장은 번짐이 걷히는 스머징 하나로 통일된다.
- 깊이는 그림자가 아니라 반투명도와 1px 따뜻한 선, 그리고 금빛 글로우로 만든다.
- 금빛은 상태의 언어다. 기본 상태에는 없다.
- 한 손, 한 화면, 최대 430px. 넓은 화면용 레이아웃은 존재하지 않는다.

## Colors

팔레트 전체가 구리에서 아이보리로 이어지는 한 줄의 온도 계단이다. 회색은 없고, 차가운 색은 없고, 브론즈 계열 밖의 색조는 사진 안에만 존재한다.

### Primary
- **현상액 브론즈** (`#a27251` → `#6a432b`): 모든 화면의 바탕. 위에서 아래로 6단(0%, 36%, 54%, 72%, 87%, 100%) 짙어지는 세로 그라디언트로, 화면 위쪽이 빛에 가깝고 아래쪽이 트레이 바닥에 가깝다. `--bg` 하나로 쓰고 화면별로 다시 만들지 않는다.
- **세이프라이트 글로우** (`rgb(176 124 86 / 0.35)`): 화면 상단 35% 지점에 걸리는 타원 방사 광. 배경 위에 포인터 이벤트 없는 한 겹으로 얹혀, 대화가 시작되는 높이를 밝힌다.

### Secondary
- **현상 진선** (`#f4d2bb`): 금빛 테두리의 선 색. 선택·신호·확정의 순간에만 나타나며 기본 상태에는 절대 없다. 항상 글로우와 함께 온다.
- **하이라이트 앰버** (`#e8b98a`): 라디오 점, 불릿, 주요 행동 칩의 아래쪽 그라디언트. 금빛 테두리보다 한 단계 조용한 강조로, 선이 아니라 면과 점에 쓴다.

### Tertiary
- **은결** (`#fdf6f1`): 반짝임의 핵과 광선. 별의 중심과 십자 광선에만 쓰이며 글자나 면에는 쓰지 않는다.
- **트레이 그림자** (`#865a3d`): 선택 카드 사진 오른쪽을 덮어 글자가 올라앉을 자리를 만드는 스크림의 끝 색. 왼쪽 45%까지 완전 투명에서 오른쪽 끝 불투명으로 간다.
- **잉크 브라운** (`#3b2418`): 금빛 면 위에 올라가는 글자. 밝은 앰버 버튼과 온보딩 글라스 버튼의 텍스트 전용이며, 어둔 배경 위에는 절대 쓰지 않는다.

### Neutral
- **인화지 아이보리** (`#f7eee6`): 본문 글자. 불투명도를 내려 계층을 만든다. 100%는 본문과 카드 제목, 85%는 부가 문장, 70%는 카드 설명과 보조 안내, 60%는 섹션 라벨, 45~50%는 구분 기호와 비활성.
- **컨트롤 아이보리** (`#f5f1e1`): 입력 바 글자와 아이콘, 포커스 링. 본문보다 살짝 따뜻하고 노란 쪽이다.
- **아이콘 아이보리** (`#f8ede4`): 헤더 메뉴 선과 뒤로 가기 같은 순수 아이콘.
- **감광 패널** (`rgb(245 178 138 / 0.15)`): 말풍선·카드·칩의 면. 불투명 색이 아니라 배경을 15%만 덮는 반투명 살구빛이라, 같은 토큰이 화면 위쪽에서는 밝고 아래쪽에서는 짙게 보인다.
- **감광 테두리** (`rgb(245 176 121 / 0.37)`): 모든 패널의 1px 경계. 이 시스템에서 구분선의 역할을 전부 이 선이 맡는다.

### Named Rules

**The 금빛은 대답이다 Rule.** 현상 진선과 금빛 글로우는 상태 변화에만 등장한다. 선택됨, 차례가 왔음, 확정됨, 포커스됨. 기본 상태의 장식으로 금빛을 쓰는 순간 이 시스템의 유일한 신호 체계가 무너진다.

**The 회색 금지 Rule.** 보조 텍스트는 회색으로 내리지 않고 인화지 아이보리의 불투명도로 내린다. `#F7EEE6/70`은 있고 `#9E9E9E`는 없다. 회색을 들이면 따뜻한 봉이 즉시 탁해진다.

**The 한 장의 바탕 Rule.** 새 화면은 `--bg`와 `--bg-glow`를 그대로 쓴다. 화면마다 다른 배경색·다른 그라디언트를 만들지 않는다.

## Typography

**Body Font:** Pretendard Variable (`45 920` 가변 축, 직접 호스팅)
**Display Font:** 없음. 표시용 서체를 따로 두지 않고 같은 가변 축의 큰 크기와 굵기로 위계를 만든다.

**Character:** 한국어를 위해 설계된 기하학적 산세리프 한 벌로 전부 해결한다. 장식이 없고 한글과 라틴의 회색도가 고르기 때문에, 화면의 성격은 서체가 아니라 브론즈 봉과 스머징 리듬이 만든다. 굵기는 거의 400에 머물고, 500은 점수에만 쓴다. 굵게 쓰는 대신 크게 쓰거나 밝게 쓴다.

폰트 파일은 `public/fonts/PretendardVariable.subset.woff2` (457 KB, KS X 1001 상용 한글 2,350자 + 라틴)이며 `ReactDOM.preload`로 미리 받는다. 상용자 밖의 희귀 음절은 기기 한글 폰트로 떨어진다.

### Hierarchy
- **Display** (500, 40px, 1.0, tracking `-0.025em`): 피부 궁합 점수 숫자 하나에만. `0 0 18px rgb(255 226 190 / 0.35)` 글자 글로우를 달아 이 숫자가 화면에서 유일하게 빛나는 텍스트가 된다.
- **Headline** (400, 22px, 1.2): 분석 결과 같은 독립 화면의 제목. 앞에 ✦ 한 글자를 세워 제목임을 알린다.
- **Title** (400, 17px, 1.2): 제품명. 카드 안에서 가장 큰 글자.
- **Body** (400, 15px, 1.4): 말풍선 본문과 선택 카드 제목. 이 시스템의 기본 크기다.
- **Label** (400, 12px, 1.45, 아이보리 60~80%): 카드 설명, 섹션 제목, 보조 안내. 10~11px은 상태 태그와 각주에만 내려 쓴다.

### Named Rules

**The keep-all Rule.** 한국어 본문은 전부 `word-break: keep-all`이다. 어절이 줄 끝에서 쪼개지면 늦은 리듬으로 한 단어씩 드러내는 연출이 무의미해진다. 새로 쓰는 한국어 텍스트 블록에도 반드시 넣는다.

**The 잉크 간격 Rule.** 말풍선 본문은 `text-box: trim-both cap alphabetic`으로 첫 줄 위와 마지막 줄 아래를 글자 기준으로 자른다. 줄 상자 여백이 아니라 잉크 기준으로 위아래가 같아야 반투명 패널 안에서 글이 가운데 앉는다.

**The 굵기 대신 밝기 Rule.** 강조는 굵기를 올리지 않고 불투명도를 올린다. 70%에서 100%로 가는 것이 400에서 700으로 가는 것보다 이 봉에서 잘 읽힌다.

## Layout

단일 컬럼 폰 프레임 하나가 전부다. 모든 화면은 `max-width: 430px`로 가운데 정렬되고 `height: 100dvh`를 채운다. 데스크톱에서도 같은 폰 프레임이 가운데 서고 남는 좌우는 브론즈 봉이 된다. 브레이크포인트는 정의하지 않는다. 넓은 화면 전용 레이아웃이 없기 때문에 반응형 분기도 없다.

좌우 여백은 16px(`--gutter`)이고 대화 영역은 `px-4`로 같은 값을 쓴다. 세로 리듬은 말풍선 사이 `10px` 스택이 기본이며, 카드 목록은 `10px`, 칩 줄은 `8px` 간격이다. AI 말풍선은 32px 아바타와 8px 간격을 두고 시작하고, 칩과 행동 버튼은 `calc(32px + 8px)`만큼 들여써서 아바타 오른쪽 선에 맞춘다. 사용자 말풍선은 오른쪽 정렬에 최대 폭 78%, AI 말풍선은 오른쪽에 9px(첫인사는 30px) 여백을 남겨 화면 폭을 다 쓰지 않는다.

안전 영역을 직접 다룬다. 헤더는 `env(safe-area-inset-top) + 8px`, 입력 바는 `bottom: env(safe-area-inset-bottom)`에 고정된 48px 높이 336px 폭 알약이다. 늦게 등장하는 요소가 `scrollIntoView`될 때 이 고정 바에 깔리지 않도록 `scroll-margin-bottom: calc(env(safe-area-inset-bottom) + 68px)`을 둔다.

온보딩만 다른 규칙을 쓴다. 941×1672 아트보드 이미지를 전면에 깔고 실제 컨트롤을 아트보드 퍼센트 좌표로 그 위에 얹는다. 이미지 위 컨트롤은 불투명 글라스로 원본 그림의 버튼을 가린다.

### Named Rules

**The 한 손 Rule.** 430px 밖을 위한 레이아웃을 만들지 않는다. 데스크톱은 폰 프레임을 가운데 세우는 것으로 끝이다.

**The 안전 영역은 손으로 Rule.** 고정 요소는 `env(safe-area-inset-*)`를 직접 계산한다. 하단 고정 바가 있는 화면에 새 요소를 넣으면 `reveal-scroll`을 함께 붙인다.

## Elevation & Depth

그림자를 쓰지 않는 시스템이다. 깊이는 세 가지로만 만든다. 첫째, 반투명도. 감광 패널이 배경을 15%만 덮으면서 아래 그라디언트가 비쳐 보이기 때문에 패널이 봉 위에 떠 있지 않고 봉 안에 잠겨 있다. 둘째, 1px 따뜻한 선. 모든 경계가 같은 굵기의 같은 색이라 층이 겹쳐도 서열이 생기지 않는다. 셋째, 금빛 글로우. 이것만이 요소를 앞으로 끌어내며, 오직 상태 변화에 반응한다.

범용 그림자 스케일은 이 시스템에 없다. 검은 그림자를 떨어뜨리면 따뜻한 봉이 즉시 탁해진다. 물체의 부피를 표현할 때만 inset 그림자를 쓴다.

### Shadow Vocabulary
- **금빛 글로우** (`--gold-glow`: `0 0 3px 1px rgb(244 210 187 / 0.9), 0 0 14px 3px rgb(228 153 103 / 0.75), 0 0 30px 8px rgb(228 153 103 / 0.4), inset 0 0 8px 2px rgb(200 130 83 / 0.7)`): 선택·신호·확정. 바깥 3겹과 안쪽 1겹이 한 세트로, 선이 켜지는 것이 아니라 선이 달아오르는 느낌을 만든다. 현상 진선 테두리와 항상 함께 쓴다.
- **반짝임 글로우** (`--sparkle-glow`: `0 0 10px rgb(245 196 138 / 0.45), 0 0 4px rgb(237 169 126 / 0.6)`): ✦ 글자와 별의 발광. `text-shadow`로도 `box-shadow`로도 쓴다.
- **구슬 부피** (`inset -7px -9px 18px rgb(118 68 38 / 0.45), inset 7px 9px 16px rgb(255 238 214 / 0.35)` + `0 0 20px rgb(240 190 140 / 0.55)`): 브론즈 구슬의 입체. 반대 방향 inset 두 개로 구를 만들고 바깥 글로우로 발광시킨다.
- **입력 필드 함몰** (`0 0 6px rgb(60 35 20 / 0.18), inset 0 1px 3px rgb(255 235 215 / 0.10)`): 필드가 바 안으로 눌려 들어간 느낌. 어둔 바깥 그림자는 이 한 곳에만 허용된다.
- **공식 제품컷 접지** (`drop-shadow(0 6px 10px rgb(60 30 10 / 0.35))`): 배경이 제거된 제품 PNG가 베이지 타일 위에 놓인 것처럼 보이게 하는 유일한 낙하 그림자.

### Named Rules

**The 그림자 없음 Rule.** 표면은 기본 상태에서 평평하다. 검은 그림자로 요소를 띄우지 않는다. 띄워야 하면 글로우를 쓰고, 부피를 만들어야 하면 inset을 쓴다.

**The 1px 한 겹 Rule.** 경계는 언제나 1px 감광 테두리다. 굵은 색 테두리나 좌측 강조선으로 종류를 구분하지 않는다. 선택된 상태만 1.3px 현상 진선으로 바뀐다.

## Shapes

부드럽지만 동그랗지는 않은 형태 언어다. 반경은 요소의 크기에 비례해 커진다. 입력 필드 8px, 사진 타일 10px, 칩과 행동 버튼 12px, 제품 행 14px, 말풍선과 섹션 패널 16px, 선택 카드와 추천 카드 18px. 알약 형태(`9999px`)는 손가락이 직접 닿는 원형 컨트롤에만 쓴다. 아바타, 입력 바 전체, 보내기 버튼, 첨부·마이크 버튼, 성분 칩, 라디오 점.

각진 모서리는 없다. `--radius-none`은 정의되어 있지만 쓰이지 않는다.

한 가지 작은 기하가 반복된다. AI 말풍선 왼쪽 위에 붙는 7×7px 꼬리다. 45도 회전한 정사각형에 왼쪽과 아래쪽만 1px 선을 주고 `border-radius: 1px`을 얹어, 말풍선 테두리가 끊기지 않고 이어진 것처럼 보이게 한다. 삼각형을 그리지 않고 사각형을 돌려 쓰는 이유가 여기 있다.

사진은 언제나 잘라서 채운다. 선택 카드 썸네일은 88px 고정 폭에 `object-fit: cover`이고, 핵심 부위가 가운데가 아닌 사진만 `object-position`을 따로 지정한다. 제품 사진은 두 종류로 갈린다. 공식 패키지컷은 `contain` + 8px 패딩 + 낙하 그림자로 타일 위에 놓고, 촬영 crop은 `cover`로 타일을 가득 채운다.

## Components

### Chat Bubble
수줍은 유리판이다. 반투명 감광 패널에 1px 테두리, 16px 반경, 본문 15px/1.4.

- **Shape:** 16px 반경. AI 말풍선은 왼쪽 위에 7×7px 회전 사각형 꼬리.
- **Padding:** 한 문장이면 `18px 20px`, 여러 문장이면 위아래를 9px 늘려 `28px 20px`.
- **AI / 사용자:** 면과 테두리가 완전히 같다. 좌우 정렬과 아바타 유무로만 구분한다. 사용자 말풍선은 최대 폭 78%.
- **아바타:** 32px 원, 같은 면과 테두리, 가운데 ✦ 한 글자에 반짝임 글로우. 원 안에 2px 별 두 개가 무작위로 깜빡인다.
- **등장:** 예약 시각까지 DOM에 없다가 말풍선과 글자가 함께 스머징하며 나타난다. 글자는 단어 단위로 `80ms`씩 이어지고 문장은 `2000ms`씩 벌어진다.
- **첫인사 말풍선:** `decorated` 변형만 별 세 개와 테두리 글림트를 달고 오른쪽 여백을 30px로 넓힌다.

### Chips
- **Quick prompt / 보조 행동:** 감광 패널 면, 1px 감광 테두리, 12px 반경, `10px 16px` 패딩, 14px 글자. 아바타 오른쪽 선(40px)에 맞춰 들여쓴다.
- **주요 행동:** `linear-gradient(180deg, #F6E3CF 0%, #E8B98A 100%)` 면에 현상 진선 테두리, 잉크 브라운 글자. 한 줄에 하나만 둔다.
- **신호 상태:** 차례가 오면 `chip-nudge` 3초. 천천히 1.08배로 커지며 금빛 테두리와 글로우가 켜지고, 되튕겨 앉은 뒤 빛을 머금다 잦아든다. 한 바퀴 돌면 7초 쉬고 다시 돈다.
- **탭 상태:** `chip-pop` 700ms. 1.1배까지 튀었다 0.95배로 눌리고 제자리로 앉는다. 이 연출이 끝난 뒤에 다음 단계가 붙는다.
- **성분 칩:** 알약 형태, `rgb(255 233 210 / 0.12)` 면, 12px 글자, 뒤에 10px 역할 라벨.

### Choice Cards
피부 타입·고민을 고르는 이 시스템의 주역이다. 왼쪽 88px 사진, 오른쪽 라벨과 설명.

- **Shape:** 18px 반경, 넘치는 사진을 자르는 `overflow: hidden`.
- **기본:** 감광 패널 면, 1.3px 감광 테두리.
- **선택됨:** 테두리가 1.3px 현상 진선으로 바뀌고 금빛 글로우가 켜진다. 오른쪽 라디오가 하이라이트 앰버로 채워지고 안에 `#5A3A22` 점이 앉는다.
- **사진 스크림:** 사진 위에 `linear-gradient(90deg, transparent 0%, transparent 45%, #865A3D 100%)`을 덮어 오른쪽 글자 자리를 만든다.
- **Hover:** `-2px` 들림, 200ms. `motion-reduce`에서는 움직이지 않는다.
- **탭:** `skin-card-pop` 520ms. 원근 700px에서 앞으로 7도 기울며 1.05배로 들렸다 되튕겨 앉고, 같은 520ms 동안 글로우가 최대로 터졌다 평상 글로우로 정착한다.
- **선택 후:** 목록 전체가 `disabled`가 되고 고르지 않은 카드는 60% 불투명도로 내려앉는다. 다시 고를 수 없다.
- **등장:** 카드가 `1000ms`씩 한 장씩 스머징하며 쌓인다.

### Input Bar
화면 하단에 고정된 48px 높이 336px 폭 알약 하나. 안에 첨부 버튼, 필드, 보내기 버튼이 들어간다.

- **바:** `linear-gradient(180deg, rgba(255 215 175 / 0.24), rgba(255 215 175 / 0.20))` 면, `rgba(255 215 175 / 0.18)` 1px 테두리, `inset 0 0 8px rgba(255 215 175 / 0.12)`.
- **필드:** 알약, `rgba(240 228 225 / 0.12)` 면, 12px 글자, `letter-spacing: -0.02em`, 컨트롤 아이보리. 함몰 그림자를 달고 `outline: none` 대신 `focus-visible` 링을 쓴다.
- **첨부 버튼:** 31px 원, 투명 면, `rgba(255 215 175 / 0.35)` 테두리, `inset 0 0 10px` 따뜻한 빛. 13px 십자 아이콘에 `drop-shadow`.
- **보내기 버튼:** 36px 원. `radial-gradient(circle at 50% 55%, #8D6244, #A26C4A 45%, #BB7D52 70%, #D09065 85%, #E1AB87 95%)` 구슬 면에 오로라 링이 테두리로 돈다. 탭하면 0.94배로 눌린다. 비활성은 60% 불투명도.
- **오로라 링:** 13색 원추 그라디언트를 1.5px 링으로 마스크하고 `blur(0.5px)`을 얹어, 12초에 한 바퀴 돌면서 4초 주기로 밝기가 숨 쉰다.

### Cards / Containers
- **추천 카드:** 18px 반경, `16px 20px` 패딩. 제목 줄 앞에 ✦, 오른쪽에 78px 브론즈 구슬.
- **제품 행:** 14px 반경, 10px 패딩, 12px 간격. 왼쪽 112×96px 타일(10px 반경)에 `radial-gradient(ellipse 80% 55% at 50% 30%, rgb(255 236 214 / 0.55), transparent 70%), linear-gradient(180deg, #D9B896, #C39B74 60%, #A77E5A)` 연출 배경. 행 사이는 16px ⌄ 아이콘으로 잇는다.
- **분석 섹션:** 16px 반경, `14px 16px` 패딩. 12px 60% 아이보리 제목 아래 본문.
- **Shadow Strategy:** 전부 없음. Elevation & Depth의 그림자 없음 규칙을 따른다.

### Inputs / Fields
- **인라인 편집 필드:** 8px 반경, 투명 면, 1px 감광 테두리, 12px 글자, 플레이스홀더 40% 아이보리.
- **Focus:** 모든 컨트롤이 `focus-visible:outline-2 outline-offset-2`에 `#F7EEE6` 또는 `#F5F1E1` 링. 브라우저 기본 파란 링을 남기지 않는다.
- **온보딩 글라스 컨트롤:** 로그인·프로필 화면은 시안 이미지 위에 얹히므로 불투명하다. `rgb(148 104 72 / 0.97)` 면에 `rgb(245 176 121 / 0.45)` 테두리. 주요 버튼은 `linear-gradient(180deg, rgb(232 185 138 / 0.97), rgb(196 140 96 / 0.97))`에 `0 0 18px rgb(232 185 138 / 0.55)` 글로우, 잉크 브라운 글자, `0.22em` 자간.
- **온보딩 시작 버튼:** 가릴 UI가 없는 깨끗한 인물 사진 위에 서므로 반투명 유리다. `rgb(255 241 224 / 0.14)` → `rgb(236 192 150 / 0.06)` 면, `backdrop-filter: blur(3px)`, `rgb(244 210 187 / 0.72)` 1px 테두리, 바깥 금빛 글로우와 상단 안쪽 하이라이트. 글자는 아이보리이고 `0.2em` 자간이다. 알약 뒤에는 `rgb(46 27 15 / 0.22)`를 `blur(12px)`로 깐 못이 있다 — 반투명 면이 배경을 밝혀 라벨 대비가 2.2:1까지 떨어지기 때문이며, 이 못이 4.9:1로 올린다.

### Navigation
헤더는 거의 비어 있다. 20px 폭 안에 1px 선 세 개를 5px 간격으로 세운 메뉴 버튼 하나뿐이고, 색은 아이콘 아이보리다. 독립 화면은 40px 원형 뒤로 가기 버튼을 왼쪽에 둔다. 상단 바도 제목 줄도 없으며, 화면의 제목은 본문 영역 안에서 시작한다.

### Typing Indicator
AI가 답을 만드는 동안 말풍선 자리에 뜬다. 아바타와 말풍선 토큰을 그대로 빌려 꼬리까지 같고, 안에 6px 점 세 개가 `180ms` 차이로 1.2초 주기로 떠올랐다 가라앉는다. `role="status"`를 달아 스크린 리더에 알린다.

### Sparkle System (signature)
이 시스템을 살아있게 만드는 장치다. 세 부분으로 나뉜다.

- **별:** 은결 핵과 선택적 십자 광선. `1500 + random(2500)`ms마다 1.2초 동안 켜지며, 켜질 때 1.15배로 커지고 글로우가 1.5배가 된다. 꺼지면 0.6배 35% 불투명도로 물러난다. 전환은 600ms.
- **테두리 글림트:** 패널 테두리의 무작위 지점에서 6px 흐린 점이 `4000 + random(3000)`ms마다 생겨 30~40px 흘러가며 사라진다. 1초.
- **✦ 문자:** 아바타와 제목 앞에 서는 유니코드 한 글자. 반짝임 글로우를 `text-shadow`로 받는다. 아이콘 체계와 별개로, 이것만 문자로 허용된다.

모든 반짝임은 탭이 백그라운드로 가면 멈추고, `prefers-reduced-motion`에서는 켜진 상태로 고정된다.

## Do's and Don'ts

### Do:
- **Do** `--bg`와 `--bg-glow`를 새 화면의 바탕으로 그대로 쓴다. 화면 전용 배경을 만들지 않는다.
- **Do** 패널이 필요하면 `--bubble-fill` 면 + 1px `--bubble-stroke` 테두리 조합을 쓴다. 이 두 토큰이 이 시스템의 표면 전부다.
- **Do** 보조 텍스트를 `#F7EEE6`의 불투명도(85/70/60/50%)로 내린다.
- **Do** 한국어 텍스트 블록에 `word-break: keep-all`을 넣는다.
- **Do** 새로 등장하는 요소는 `Appear`와 `smudge-block`으로 스머징하며 내보낸다. 순서가 있으면 `app/lib/reveal.ts`의 간격 상수를 쓰고 새 숫자를 발명하지 않는다.
- **Do** 금빛 테두리를 켤 때 `--gold-line`과 `--gold-glow`를 한 세트로 쓴다.
- **Do** 모든 인터랙티브 요소에 `focus-visible:outline-2 outline-offset-2` 아이보리 링을 단다.
- **Do** 하단 고정 바가 있는 화면의 새 요소에 `reveal-scroll`을 붙인다.
- **Do** 아이콘은 `strokeWidth` 1.3~1.6의 인라인 SVG로 그린다.
- **Do** 사용자 이름은 `app/lib/locale/ko.ts`의 `userName`을 거쳐 표시하고, 모든 문구를 이 파일에 모은다.

### Don't:
- **Don't** 회색을 쓰지 않는다. 지워진 `gray-50`~`gray-900`을 되살리거나 새 회색 단계를 들이지 않는다.
- **Don't** 오렌지 팔레트(`#FF6B3D` 계열 `prime-*`)를 되살리지 않는다. `docs/design-tokens.md` 초판이 선언했지만 이 세계는 쓰지 않으며 토큰도 제거됐다.
- **Don't** 범용 그림자 스케일(`shadow-sm`~`shadow-2xl`)을 되살리거나 검은 낙하 그림자로 요소를 띄우지 않는다. 지워진 토큰이다.
- **Don't** 상태 색(초록·노랑·빨강·파랑)을 들여오지 않는다. 점수와 경고는 아이보리·앰버 계열 안에서 표현한다(`#F6E3CF` / `#F0DCC6`).
- **Don't** 금빛 테두리와 글로우를 기본 상태의 장식으로 쓰지 않는다. 상태에만 반응한다.
- **Don't** 브레이크포인트를 다시 정의하거나 넓은 화면 전용 레이아웃을 만들지 않는다. 430px 폰 프레임이 전부다.
- **Don't** 새 등장 애니메이션을 발명하지 않는다. 스머징 하나로 통일한다. 슬라이드인, 바운스, 페이드온리는 이 세계의 언어가 아니다.
- **Don't** 이모지를 UI나 AI 응답에 쓰지 않는다. ✦만 예외다.
- **Don't** 유니코드 글자나 이모지로 아이콘을 대신하지 않는다.
- **Don't** 각진 모서리를 쓰지 않는다. 가장 작은 반경도 8px이다.
- **Don't** 카드 안에 카드를 넣지 않는다. 제품 행과 분석 섹션은 같은 층에 나란히 놓인다.
- **Don't** `ChatBackground.tsx`가 들고 있던 하늘색·크림색 세계(`#A3CCFB`, `#FFF6D9`, 보라 구름)를 되살리지 않는다. 지워진 프로토타입이며 이 시스템의 안티 레퍼런스다.
