#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Export patch payload for updating runtime asset registry/scene configuration."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    args = parse_args()
    metadata = load_json(args.metadata)
    patch = {"asset_patches": []}
    for asset in metadata.get("assets", []):
        patch["asset_patches"].append(
            {
                "sprite_key": asset["sprite_key"],
                "recommended_scale": asset["recommended_scale"],
                "anchor": asset["anchor"],
                "z": asset["z"],
                "collision_box": asset["collision_box"],
            }
        )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(patch, f, indent=2)
        f.write("\n")
    print(f"Wrote patch payload for {len(patch['asset_patches'])} assets to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
