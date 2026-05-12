#!/usr/bin/env python3
"""
Chrome Web Store 스크린샷 크롭 스크립트.

screenshots/raw/ 폴더 안의 모든 PNG/JPG를 1280x800으로 자릅니다.
규칙: top-anchored cover — 비율 유지하며 가로폭에 맞추고, 세로는 위부터 자름.
브라우저 스크린샷에서 URL 바·상단 UI를 보존하기 위함.

사용:
    cd ai-domain-check
    python3 scripts/crop-store-screenshots.py

요구사항: pip install Pillow
"""

import os
from pathlib import Path
from PIL import Image

TARGET_W = 1280
TARGET_H = 800

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
RAW_DIR = PROJECT_ROOT / "screenshots" / "raw"
OUT_DIR = PROJECT_ROOT / "screenshots" / "store"


def crop_top_anchored(src: Path, dst: Path) -> tuple[int, int, int, int]:
    """원본을 1280x800으로 비율 보존 리사이즈 후 top-anchored crop.

    Returns: (src_w, src_h, dst_w, dst_h)
    """
    img = Image.open(src)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    target_ratio = TARGET_W / TARGET_H

    if src_ratio > target_ratio:
        # 원본이 더 widescreen — 세로 기준으로 리사이즈 후 좌우 중앙 크롭
        new_h = TARGET_H
        new_w = round(src_w * (TARGET_H / src_h))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - TARGET_W) // 2
        img = img.crop((left, 0, left + TARGET_W, TARGET_H))
    else:
        # 원본이 더 세로로 김 — 가로 기준으로 리사이즈 후 위부터 크롭 (URL 바 보존)
        new_w = TARGET_W
        new_h = round(src_h * (TARGET_W / src_w))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img = img.crop((0, 0, TARGET_W, TARGET_H))

    # PNG로 저장 (Chrome Web Store는 PNG/JPEG 모두 허용)
    img = img.convert("RGB")  # 알파 채널 제거 — Chrome Web Store 요구
    img.save(dst, format="PNG", optimize=True)

    return src_w, src_h, TARGET_W, TARGET_H


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_files = sorted(
        [p for p in RAW_DIR.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}]
    )

    if not raw_files:
        print(f"raw 폴더가 비어 있습니다: {RAW_DIR}")
        return

    for src in raw_files:
        dst = OUT_DIR / f"{src.stem}.png"
        sw, sh, dw, dh = crop_top_anchored(src, dst)
        print(f"  {src.name} ({sw}x{sh}) → {dst.relative_to(PROJECT_ROOT)} ({dw}x{dh})")

    print(f"\n완료. {OUT_DIR.relative_to(PROJECT_ROOT)} 안의 PNG를 Chrome Web Store에 업로드하시면 됩니다.")


if __name__ == "__main__":
    main()
