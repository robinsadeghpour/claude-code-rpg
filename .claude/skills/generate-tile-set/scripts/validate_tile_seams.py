#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Validate tile seam continuity by comparing opposite edges."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def edge_mean_abs_diff(a: list[tuple[int, int, int, int]], b: list[tuple[int, int, int, int]]) -> float:
    total = 0
    count = min(len(a), len(b))
    for i in range(count):
        total += sum(abs(a[i][c] - b[i][c]) for c in range(4))
    return total / (count * 4) if count else 0.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--max-edge-diff", type=float, default=35.0)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    img = Image.open(args.image).convert("RGBA")
    px = img.load()

    left = [px[0, y] for y in range(img.height)]
    right = [px[img.width - 1, y] for y in range(img.height)]
    top = [px[x, 0] for x in range(img.width)]
    bottom = [px[x, img.height - 1] for x in range(img.width)]

    lr = edge_mean_abs_diff(left, right)
    tb = edge_mean_abs_diff(top, bottom)
    worst = max(lr, tb)

    print(f"left-right diff: {lr:.2f}")
    print(f"top-bottom diff: {tb:.2f}")
    if worst > args.max_edge_diff:
        print(f"Seam validation failed: worst edge diff {worst:.2f} > {args.max_edge_diff:.2f}")
        return 1
    print("Seam validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
