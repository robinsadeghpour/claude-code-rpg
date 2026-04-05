#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Normalize prop sprite image (cleanup, trim, fit canvas)."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--padding", type=int, default=8)
    parser.add_argument("--alpha-noise-threshold", type=int, default=20)
    return parser.parse_args()


def cleanup_alpha(img: Image.Image, threshold: int) -> Image.Image:
    out = img.convert("RGBA")
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < threshold:
                px[x, y] = (r, g, b, 0)
    return out


def main() -> int:
    args = parse_args()
    src = Image.open(args.input).convert("RGBA")
    src = cleanup_alpha(src, args.alpha_noise_threshold)
    bbox = src.getbbox()
    if bbox:
        src = src.crop(bbox)

    canvas = Image.new("RGBA", (args.size, args.size), (0, 0, 0, 0))
    max_w = max(1, args.size - args.padding * 2)
    max_h = max(1, args.size - args.padding * 2)
    scale = min(max_w / src.width, max_h / src.height)
    nw = max(1, int(src.width * scale))
    nh = max(1, int(src.height * scale))
    rs = src.resize((nw, nh), Image.Resampling.NEAREST)
    x = (args.size - nw) // 2
    y = args.size - args.padding - nh
    canvas.alpha_composite(rs, (x, y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output)
    print(f"Wrote normalized prop: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
