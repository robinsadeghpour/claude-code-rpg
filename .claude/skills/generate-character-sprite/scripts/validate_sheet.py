#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///

"""Validate sprite sheet dimensions and frame-level integrity checks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sheet", type=Path, required=True, help="sprite sheet png")
    parser.add_argument("--expected-size", type=int, default=1024, help="expected sheet width and height")
    parser.add_argument("--frame-size", type=int, default=256, help="expected frame width and height")
    parser.add_argument("--min-opaque-pixels", type=int, default=500, help="minimum opaque pixels per frame")
    parser.add_argument("--report", type=Path, help="optional json report output path")
    return parser.parse_args()


def opaque_pixel_count(img: Image.Image) -> int:
    alpha = img.split()[3]
    return sum(1 for value in alpha.getdata() if value > 0)


def frame_box(col: int, row: int, frame_size: int) -> tuple[int, int, int, int]:
    x0 = col * frame_size
    y0 = row * frame_size
    return (x0, y0, x0 + frame_size, y0 + frame_size)


def mirror_similarity_score(left_img: Image.Image, right_img: Image.Image) -> float:
    mirrored_right = right_img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    diff = ImageChops.difference(left_img, mirrored_right)
    hist = diff.histogram()
    total = left_img.width * left_img.height * 4 * 255
    err = 0
    for idx, count in enumerate(hist):
        channel_value = idx % 256
        err += channel_value * count
    return max(0.0, 1.0 - (err / total))


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    warnings: list[str] = []
    report: dict[str, Any] = {"sheet": str(args.sheet), "errors": errors, "warnings": warnings, "frames": {}}

    img = Image.open(args.sheet).convert("RGBA")
    if img.width != args.expected_size or img.height != args.expected_size:
        errors.append(
            f"Sheet size is {img.width}x{img.height}, expected {args.expected_size}x{args.expected_size}."
        )

    if img.width != args.frame_size * 4 or img.height != args.frame_size * 4:
        errors.append(f"Sheet does not map cleanly to 4x4 grid with frame size {args.frame_size}.")

    for row in range(4):
        for col in range(4):
            fid = row * 4 + col
            frame = img.crop(frame_box(col, row, args.frame_size))
            opaque = opaque_pixel_count(frame)
            report["frames"][f"frame-{fid}"] = {"row": row, "col": col, "opaque_pixels": opaque}
            if opaque < args.min_opaque_pixels:
                errors.append(
                    f"Frame {fid} has only {opaque} opaque pixels (< {args.min_opaque_pixels}); likely empty or broken."
                )

    # Check left row against mirrored right row as a consistency heuristic.
    # This is advisory only because asymmetrical sprites are valid.
    for i in range(4):
        right = img.crop(frame_box(i, 2, args.frame_size))
        left = img.crop(frame_box(i, 3, args.frame_size))
        score = mirror_similarity_score(left, right)
        report["frames"][f"mirror-score-{i}"] = {"right_index": i, "left_index": i, "score": round(score, 4)}
        if score < 0.75:
            warnings.append(
                f"Left/right frame pair index {i} mirror score is {score:.2f}; confirm intentional asymmetry."
            )

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
