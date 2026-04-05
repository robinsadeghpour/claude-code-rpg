#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///

"""Normalize a building sprite: cleanup, trim, and optional size clamp."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="source building png")
    parser.add_argument("--output", type=Path, required=True, help="normalized building png")
    parser.add_argument("--max-width", type=int, default=640, help="maximum output width")
    parser.add_argument("--max-height", type=int, default=1024, help="maximum output height")
    parser.add_argument("--dark-threshold", type=int, default=32, help="dark pixels threshold for bg removal")
    parser.add_argument("--alpha-noise-threshold", type=int, default=20, help="alpha noise threshold")
    return parser.parse_args()


def remove_dark_background(img: Image.Image, dark_threshold: int, alpha_noise_threshold: int) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a < alpha_noise_threshold:
                px[x, y] = (r, g, b, 0)
                continue
            if r < dark_threshold and g < dark_threshold and b < dark_threshold:
                px[x, y] = (r, g, b, 0)
    return rgba


def trim_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def resize_if_needed(img: Image.Image, max_width: int, max_height: int) -> Image.Image:
    w, h = img.size
    scale = min(max_width / w, max_height / h, 1.0)
    if scale >= 1.0:
        return img
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    return img.resize((nw, nh), Image.Resampling.NEAREST)


def main() -> int:
    args = parse_args()
    src = Image.open(args.input)
    cleaned = remove_dark_background(src, args.dark_threshold, args.alpha_noise_threshold)
    trimmed = trim_to_content(cleaned)
    final = resize_if_needed(trimmed, args.max_width, args.max_height)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    final.save(args.output)
    print(f"Wrote normalized building: {args.output} ({final.width}x{final.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
