#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///

"""Assemble normalized frames into a 4x4 sprite sheet."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


FRAME_ORDER = [
    "down-0",
    "down-1",
    "down-2",
    "down-3",
    "up-0",
    "up-1",
    "up-2",
    "up-3",
    "right-0",
    "right-1",
    "right-2",
    "right-3",
    "left-0",
    "left-1",
    "left-2",
    "left-3",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", type=Path, required=True, help="directory of normalized frame png files")
    parser.add_argument("--output", type=Path, required=True, help="sprite sheet output png")
    parser.add_argument(
        "--mirror-left-from-right",
        action="store_true",
        help="if left-* files are missing, mirror right-* frames automatically",
    )
    return parser.parse_args()


def load_frame(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def read_or_mirror_left(frame_id: str, frames_dir: Path) -> Image.Image:
    frame_path = frames_dir / f"{frame_id}.png"
    if frame_path.exists():
        return load_frame(frame_path)

    right_id = frame_id.replace("left-", "right-")
    right_path = frames_dir / f"{right_id}.png"
    if not right_path.exists():
        raise FileNotFoundError(f"Missing frame: {frame_path} and fallback {right_path}")
    return load_frame(right_path).transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def main() -> int:
    args = parse_args()

    loaded: dict[str, Image.Image] = {}
    for frame_id in FRAME_ORDER:
        is_left = frame_id.startswith("left-")
        if is_left and args.mirror_left_from_right:
            loaded[frame_id] = read_or_mirror_left(frame_id, args.frames_dir)
        else:
            frame_path = args.frames_dir / f"{frame_id}.png"
            if not frame_path.exists():
                raise FileNotFoundError(f"Missing frame: {frame_path}")
            loaded[frame_id] = load_frame(frame_path)

    widths = {img.width for img in loaded.values()}
    heights = {img.height for img in loaded.values()}
    if len(widths) != 1 or len(heights) != 1:
        raise ValueError("All frames must share identical dimensions.")

    fw = next(iter(widths))
    fh = next(iter(heights))
    sheet = Image.new("RGBA", (fw * 4, fh * 4), (0, 0, 0, 0))

    for idx, frame_id in enumerate(FRAME_ORDER):
        row = idx // 4
        col = idx % 4
        x = col * fw
        y = row * fh
        sheet.alpha_composite(loaded[frame_id], (x, y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output)
    print(f"Wrote sprite sheet: {args.output} ({sheet.width}x{sheet.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
