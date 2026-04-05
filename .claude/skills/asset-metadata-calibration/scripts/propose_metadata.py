#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Propose metadata values from calibration request and source image dimensions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    args = parse_args()
    request = load_json(args.request)
    assets: list[dict[str, Any]] = []

    for entry in request.get("entries", []):
        img = Image.open(entry["asset_path"])
        scale = entry["target_width_px"] / img.width
        rendered_h = int(img.height * scale)
        collision_h = int(rendered_h * 0.45)
        collision_y = rendered_h - collision_h

        assets.append(
            {
                "sprite_key": entry["sprite_key"],
                "asset_path": entry["asset_path"],
                "source_size": {"width": img.width, "height": img.height},
                "recommended_scale": round(scale, 4),
                "anchor": "topleft",
                "z": entry.get("default_z", 3),
                "collision_box": {
                    "x": 0,
                    "y": collision_y,
                    "width": int(entry["target_width_px"]),
                    "height": collision_h,
                },
            }
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump({"assets": assets}, f, indent=2)
        f.write("\n")
    print(f"Wrote metadata for {len(assets)} assets to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
