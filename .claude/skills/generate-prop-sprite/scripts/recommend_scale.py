#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Recommend runtime scale for a prop sprite based on target render class."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


TARGET_WIDTH_BY_CLASS = {
    "small": 48,
    "medium": 64,
    "large": 80,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--size-class", choices=["small", "medium", "large"], default="medium")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    img = Image.open(args.image)
    target_width = TARGET_WIDTH_BY_CLASS[args.size_class]
    scale = target_width / img.width
    print(f"source_size={img.width}x{img.height}")
    print(f"size_class={args.size_class}")
    print(f"target_width={target_width}")
    print(f"recommended_scale={scale:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
