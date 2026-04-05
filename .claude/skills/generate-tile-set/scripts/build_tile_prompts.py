#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Build per-tile prompt JSON files from tileset spec and variant plan."""

from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--base-template", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    spec = load_json(args.spec)
    plan = load_json(args.plan)
    base = load_json(args.base_template)

    width = int(spec.get("tile_size", {}).get("width", 256))
    height = int(spec.get("tile_size", {}).get("height", 256))
    tile_types = list(spec.get("tile_types", [])) + list(spec.get("overlay_tile_types", []))
    variants = plan.get("variants", [])

    prompts_dir = args.out / "prompts"
    manifest: dict[str, Any] = {"tileset_id": spec["tileset_id"], "items": []}

    for tile_type in tile_types:
        for variant in variants:
            payload = deepcopy(base)
            payload["output"]["width"] = width
            payload["output"]["height"] = height
            payload["style_lock"] = spec.get("style_lock", payload.get("style_lock", {}))
            payload["tile"]["tile_type"] = tile_type
            payload["tile"]["variant_id"] = variant["id"]
            payload["tile"]["prompt_modifier"] = variant.get("prompt_modifier", "")

            name = f"{tile_type}{variant.get('filename_suffix', '')}"
            path = prompts_dir / f"{name}.json"
            write_json(path, payload)
            manifest["items"].append(
                {"name": name, "tile_type": tile_type, "variant": variant["id"], "prompt": str(path.relative_to(args.out))}
            )

    write_json(args.out / "manifest.json", manifest)
    print(f"Wrote {len(manifest['items'])} prompt files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
