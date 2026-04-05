#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///

"""Validate building sprite dimensions and transparency quality."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True, help="building sprite png")
    parser.add_argument("--min-width", type=int, default=200, help="minimum width")
    parser.add_argument("--min-height", type=int, default=300, help="minimum height")
    parser.add_argument("--max-width", type=int, default=700, help="maximum width")
    parser.add_argument("--max-height", type=int, default=1100, help="maximum height")
    parser.add_argument(
        "--min-transparent-ratio",
        type=float,
        default=0.20,
        help="minimum transparent pixel ratio to catch opaque backgrounds",
    )
    parser.add_argument("--report", type=Path, help="optional output json report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    warnings: list[str] = []

    img = Image.open(args.image).convert("RGBA")
    w, h = img.size

    if w < args.min_width or h < args.min_height:
        errors.append(f"Image too small: {w}x{h} (min {args.min_width}x{args.min_height})")
    if w > args.max_width or h > args.max_height:
        errors.append(f"Image too large: {w}x{h} (max {args.max_width}x{args.max_height})")

    alpha = img.split()[3]
    total = w * h
    transparent = sum(1 for value in alpha.getdata() if value == 0)
    transparent_ratio = transparent / total if total else 0.0

    if transparent_ratio < args.min_transparent_ratio:
        errors.append(
            f"Transparent ratio too low: {transparent_ratio:.3f} (< {args.min_transparent_ratio:.3f}); background may be opaque."
        )
    elif transparent_ratio < 0.35:
        warnings.append(
            f"Transparent ratio is {transparent_ratio:.3f}; verify no unwanted background remains."
        )

    report: dict[str, Any] = {
        "image": str(args.image),
        "size": {"width": w, "height": h},
        "transparent_ratio": round(transparent_ratio, 4),
        "errors": errors,
        "warnings": warnings,
    }

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        with args.report.open("w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
            f.write("\n")

    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"- {err}")
        if warnings:
            print("Warnings:")
            for warning in warnings:
                print(f"- {warning}")
        return 1

    print("Validation passed.")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
