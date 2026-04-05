#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Validate generated asset metadata schema and basic value ranges."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", type=Path, required=True)
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    args = parse_args()
    data = load_json(args.metadata)
    errors: list[str] = []
    for idx, asset in enumerate(data.get("assets", [])):
        scale = float(asset.get("recommended_scale", 0))
        if scale <= 0 or scale > 2:
            errors.append(f"assets[{idx}]: invalid recommended_scale={scale}")

        box = asset.get("collision_box", {})
        for k in ("x", "y", "width", "height"):
            if k not in box:
                errors.append(f"assets[{idx}]: missing collision_box.{k}")
        if box.get("width", 0) <= 0 or box.get("height", 0) <= 0:
            errors.append(f"assets[{idx}]: non-positive collision dimensions")

    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1
    print("Validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
