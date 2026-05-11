#!/usr/bin/env python3
"""
AI Domain Check — 브랜드 아이콘 PNG 생성기.

manifest.icons와 action.default_icon에 사용되는 정적 브랜드 아이콘을 만듭니다.
chrome://extensions 카드, Chrome Web Store 썸네일, 비지원 페이지에서의 툴바 디폴트에서 표시됩니다.

per-tab 동적 아이콘(공식/미확인/사칭 의심)은 별개로 src/background/icon.ts가
OffscreenCanvas로 런타임에 그리며, 이 스크립트와 무관합니다.

디자인: slate-950 배경의 둥근 사각형 + 흰 체크
  - 슬레이트 톤으로 "감시자/검증" 무드
  - 둥근 사각형이라서 동적 아이콘(색상 원)과 시각적으로 구분됨

사용:
    python3 scripts/generate-brand-icons.py

요구사항:
    pip install Pillow
"""

import os
from PIL import Image, ImageDraw

# 배경 — slate-950
BG_COLOR = (15, 23, 42, 255)
# 전경 — 흰색 체크
FG_COLOR = (255, 255, 255, 255)

# 생성할 사이즈 (manifest.icons + action.default_icon 모두 충족)
SIZES = [16, 32, 48, 128]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'icons')


def draw_brand_icon(size: int) -> Image.Image:
    # 부드러운 가장자리 위해 2배 해상도로 그리고 LANCZOS 다운샘플
    scale = 2
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 둥근 사각형 배경
    radius = max(3, int(s * 0.22))
    draw.rounded_rectangle([(0, 0), (s - 1, s - 1)], radius=radius, fill=BG_COLOR)

    # 중앙 체크마크
    cx, cy = s / 2, s / 2
    stroke = max(3, int(s * 0.13))

    p1 = (cx - s * 0.24, cy + s * 0.02)
    p2 = (cx - s * 0.05, cy + s * 0.20)
    p3 = (cx + s * 0.27, cy - s * 0.18)

    draw.line([p1, p2, p3], fill=FG_COLOR, width=stroke, joint='curve')

    # PIL line은 cap을 안 그려주므로 끝점에 원 추가
    r_cap = stroke / 2 - 0.5
    if r_cap > 0:
        for pt in [p1, p3]:
            draw.ellipse(
                [pt[0] - r_cap, pt[1] - r_cap, pt[0] + r_cap, pt[1] + r_cap],
                fill=FG_COLOR,
            )

    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for sz in SIZES:
        img = draw_brand_icon(sz)
        path = os.path.join(OUTPUT_DIR, f'icon-{sz}.png')
        img.save(path)
        print(f'saved {path} ({sz}x{sz})')


if __name__ == '__main__':
    main()
