#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Normalize tile image dimensions and alpha cleanup."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--size", type=int, default=256)
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
    img = Image.open(args.input).convert("RGBA")
    img = cleanup_alpha(img, args.alpha_noise_threshold)
    if img.size != (args.size, args.size):
        img = img.resize((args.size, args.size), Image.Resampling.NEAREST)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.output)
    print(f"Wrote normalized tile: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
