#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Validate tile dimensions and basic content quality."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--min-opaque-pixels", type=int, default=1000)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    img = Image.open(args.image).convert("RGBA")
    errors: list[str] = []
    if img.size != (args.size, args.size):
        errors.append(f"Invalid size: {img.size}, expected {(args.size, args.size)}")
    alpha = img.split()[3]
    opaque = sum(1 for value in alpha.getdata() if value > 0)
    if opaque < args.min_opaque_pixels:
        errors.append(f"Not enough visible pixels: {opaque}")
    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1
    print("Validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
