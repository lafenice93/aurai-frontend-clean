#!/usr/bin/env python3
"""public/fonts/PretendardVariable.subset.woff2 를 만든다.

Pretendard Variable 원본(모든 한글 11,172자)은 woff2로 2,009 KB다. 모바일 웹 전용인
AURAI에 그대로 얹기엔 무거워서, KS X 1001 상용 한글 2,350자 + 라틴 + 문장부호만 남겨
457 KB로 줄인다. 상용자 밖의 희귀 음절(주로 의성어·신조어·희귀 이름)은 globals.css 의
--body-font 폴백 체인에 따라 시스템 한글 폰트로 그려진다.

상용자 집합은 하드코딩하지 않고 Python 의 iso2022_kr 코덱으로 뽑는다. 이 코덱이
인코딩할 수 있는 음절이 곧 KS X 1001 의 2,350자다(cp949·euc_kr 은 확장분까지
받아주므로 쓰면 안 된다).

전체 한글이 필요해지면 KS_ONLY = False 로 바꾸고 다시 돌린다(약 1,720 KB).

필요한 것:
    python3 -m venv /tmp/fttools
    /tmp/fttools/bin/pip install "fonttools[woff]" brotli

실행:
    /tmp/fttools/bin/python scripts/build-pretendard-subset.py
"""

from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

PRETENDARD_VERSION = "1.3.9"
SOURCE_URL = (
    f"https://cdn.jsdelivr.net/npm/pretendard@{PRETENDARD_VERSION}"
    "/dist/public/variable/PretendardVariable.ttf"
)
LICENSE_URL = "https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE"

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "public" / "fonts"
OUTPUT = FONT_DIR / "PretendardVariable.subset.woff2"
LICENSE_OUT = FONT_DIR / "OFL.txt"
CACHE = Path("/tmp") / f"PretendardVariable-{PRETENDARD_VERSION}.ttf"

# False 로 바꾸면 한글 11,172자 전체를 담는다.
KS_ONLY = True


def ks_x_1001_hangul() -> list[int]:
    """KS X 1001 상용 한글 2,350자."""
    out = []
    for cp in range(0xAC00, 0xD7A4):
        try:
            chr(cp).encode("iso2022_kr")
        except UnicodeEncodeError:
            continue
        out.append(cp)
    return out


def non_hangul() -> list[int]:
    """한글 외에 남길 문자. 앱이 실제로 쓰는 글자와 한국어 웹 기본 세트."""
    out: list[int] = []

    def block(start: int, end: int) -> None:
        out.extend(range(start, end + 1))

    block(0x0020, 0x007E)  # 기본 라틴
    block(0x00A0, 0x00FF)  # 라틴-1 보충
    out += [0x0131, 0x0152, 0x0153, 0x02BB, 0x02BC, 0x02C6, 0x02DA, 0x02DC]
    block(0x2000, 0x206F)  # 일반 문장부호 — … – — ' ' " " •
    out += [0x20A9, 0x20AC, 0x2122, 0x2212]  # ₩ € ™ −
    block(0x2190, 0x2193)  # ← ↑ → ↓ — IntroFlow 의 START SKIN SCAN 화살표
    block(0x25A0, 0x25FF)  # 도형 ■ ● ▲ ◆
    block(0x2600, 0x26FF)  # 기타 기호
    block(0x3000, 0x303F)  # CJK 기호·문장부호 。「」〜
    block(0x1100, 0x11FF)  # 한글 자모
    block(0x3130, 0x318F)  # 한글 호환 자모
    block(0xA960, 0xA97F)  # 한글 자모 확장-A
    block(0xD7B0, 0xD7FF)  # 한글 자모 확장-B
    block(0xFF00, 0xFFEF)  # 전각·반각 형태
    return out


def download(url: str, dest: Path) -> None:
    print(f"내려받는 중: {url}")
    with urllib.request.urlopen(url, timeout=180) as response:
        dest.write_bytes(response.read())


def main() -> int:
    try:
        import fontTools  # noqa: F401
        import brotli  # noqa: F401
    except ImportError:
        print(
            "fonttools 와 brotli 가 필요합니다. 파일 상단의 설치 안내를 보세요.",
            file=sys.stderr,
        )
        return 1

    FONT_DIR.mkdir(parents=True, exist_ok=True)

    if not CACHE.exists():
        download(SOURCE_URL, CACHE)
    print(f"원본: {CACHE} ({CACHE.stat().st_size:,} bytes)")

    hangul = ks_x_1001_hangul() if KS_ONLY else list(range(0xAC00, 0xD7A4))
    codepoints = hangul + non_hangul()
    print(f"남길 문자: 한글 {len(hangul):,}자 + 기타 {len(non_hangul()):,}자")

    unicodes = Path("/tmp/aurai-pretendard-unicodes.txt")
    unicodes.write_text(",".join(f"U+{cp:04X}" for cp in codepoints))

    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            str(CACHE),
            f"--unicodes-file={unicodes}",
            "--flavor=woff2",
            # 한글 조합과 라틴 커닝을 건드리지 않도록 레이아웃 피처를 모두 남긴다.
            "--layout-features=*",
            "--name-IDs=*",
            f"--output-file={OUTPUT}",
        ],
        check=True,
    )

    size = OUTPUT.stat().st_size
    print(f"완성: {OUTPUT.relative_to(ROOT)} ({size:,} bytes, {size // 1024} KB)")

    if not LICENSE_OUT.exists():
        download(LICENSE_URL, LICENSE_OUT)
        print(f"라이선스: {LICENSE_OUT.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
