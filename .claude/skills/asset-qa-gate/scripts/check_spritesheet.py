#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Validate spritesheet frame consistency and optional mirror checks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops


def opaque_pixel_count(img: Image.Image) -> int:
    alpha = img.split()[3]
    return sum(1 for value in alpha.tobytes() if value > 0)


def frame_box(col: int, row: int, fw: int, fh: int) -> tuple[int, int, int, int]:
    x0 = col * fw
    y0 = row * fh
    return (x0, y0, x0 + fw, y0 + fh)


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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--min-frame-pixels", type=int, default=100)
    parser.add_argument("--check-mirrors", action="store_true")
    parser.add_argument("--mirror-row-left", type=int, default=3)
    parser.add_argument("--mirror-row-right", type=int, default=2)
    parser.add_argument("--report", type=Path, help="Output JSON report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    warnings: list[str] = []

    img = Image.open(args.image).convert("RGBA")
    w, h = img.size
    fw = w // args.cols
    fh = h // args.rows

    report = {
        "image": str(args.image),
        "sheet_size": {"width": w, "height": h},
        "grid": {"cols": args.cols, "rows": args.rows},
        "frame_size": {"width": fw, "height": fh},
        "divisible": (w % args.cols == 0 and h % args.rows == 0),
        "total_frames": args.cols * args.rows,
        "empty_frames": [],
        "sparse_frames": [],
        "errors": errors,
        "warnings": warnings,
    }

    if not report["divisible"]:
        errors.append(f"Sheet {w}x{h} not evenly divisible by {args.cols}x{args.rows} grid")

    for row in range(args.rows):
        for col in range(args.cols):
            frame = img.crop(frame_box(col, row, fw, fh))
            opaque = opaque_pixel_count(frame)
            if opaque == 0:
                errors.append(f"Frame ({col},{row}) is completely empty")
                report["empty_frames"].append({"col": col, "row": row})
            elif opaque < args.min_frame_pixels:
                warnings.append(f"Frame ({col},{row}) has only {opaque} opaque pixels")
                report["sparse_frames"].append({
                    "col": col, "row": row, "opaque_pixels": opaque,
                })

    if args.check_mirrors:
        mirror_results = []
        for i in range(args.cols):
            left = img.crop(frame_box(i, args.mirror_row_left, fw, fh))
            right = img.crop(frame_box(i, args.mirror_row_right, fw, fh))
            score = mirror_similarity_score(left, right)
            mirror_results.append({"col": i, "score": round(score, 4)})
            if score < 0.75:
                warnings.append(
                    f"Mirror pair col {i} (rows {args.mirror_row_left}/{args.mirror_row_right}) "
                    f"score {score:.2f} — confirm intentional asymmetry"
                )
        report["mirror_check"] = {
            "left_row": args.mirror_row_left,
            "right_row": args.mirror_row_right,
            "pairs": mirror_results,
        }

    report["status"] = "fail" if errors else "pass"

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if errors:
        print("Validation failed:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("Validation passed.")
    if warnings:
        print("Warnings:")
        for w_ in warnings:
            print(f"  - {w_}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
