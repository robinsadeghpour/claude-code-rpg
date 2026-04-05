#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///

"""Normalize one frame: clean background, trim, and fit to target canvas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="source frame png")
    parser.add_argument("--output", type=Path, required=True, help="normalized frame png")
    parser.add_argument("--size", type=int, default=256, help="target square size")
    parser.add_argument("--padding", type=int, default=8, help="inner padding in pixels")
    parser.add_argument(
        "--dark-threshold",
        type=int,
        default=32,
        help="pixels below this RGB threshold become transparent",
    )
    parser.add_argument(
        "--alpha-noise-threshold",
        type=int,
        default=20,
        help="alpha below this value becomes fully transparent",
    )
    return parser.parse_args()


def remove_dark_background(img: Image.Image, dark_threshold: int, alpha_noise_threshold: int) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < alpha_noise_threshold:
                pixels[x, y] = (r, g, b, 0)
                continue
            if r < dark_threshold and g < dark_threshold and b < dark_threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def trim_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def fit_canvas_bottom_center(img: Image.Image, size: int, padding: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    max_w = max(1, size - (padding * 2))
    max_h = max(1, size - (padding * 2))

    src_w, src_h = img.size
    scale = min(max_w / src_w, max_h / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.NEAREST)

    x = (size - new_w) // 2
    y = size - padding - new_h
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main() -> int:
    args = parse_args()
    src = Image.open(args.input)
    cleaned = remove_dark_background(src, args.dark_threshold, args.alpha_noise_threshold)
    trimmed = trim_to_content(cleaned)
    normalized = fit_canvas_bottom_center(trimmed, args.size, args.padding)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(args.output)
    print(f"Wrote normalized frame: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
