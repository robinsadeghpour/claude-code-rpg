#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Build per-variant Nano Banana prompt JSON files for buildings."""

from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", type=Path, required=True, help="building spec json")
    parser.add_argument("--plan", type=Path, required=True, help="variant plan json")
    parser.add_argument("--base-template", type=Path, required=True, help="base prompt template json")
    parser.add_argument("--out", type=Path, required=True, help="output directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    spec = load_json(args.spec)
    plan = load_json(args.plan)
    base = load_json(args.base_template)

    output_w = int(plan.get("output", {}).get("width", 512))
    output_h = int(plan.get("output", {}).get("height", 768))

    prompts_dir = args.out / "prompts"
    manifest: dict[str, Any] = {
        "building_id": spec["building_id"],
        "output": {"width": output_w, "height": output_h},
        "variants": [],
    }

    for variant in plan.get("variants", []):
        payload = deepcopy(base)
        payload["output"]["width"] = output_w
        payload["output"]["height"] = output_h
        payload["style_lock"] = spec["style_lock"]
        payload["building"]["id"] = spec["building_id"]
        payload["building"]["name"] = spec.get("display_name", spec["building_id"])
        payload["building"]["architecture"] = spec["architecture"]
        payload["variant"]["id"] = variant["id"]
        payload["variant"]["modifier"] = variant.get("prompt_modifier", "")

        prompt_path = prompts_dir / f"{variant['id']}.json"
        write_json(prompt_path, payload)

        manifest["variants"].append(
            {
                "id": variant["id"],
                "filename_suffix": variant.get("filename_suffix", ""),
                "prompt_path": str(prompt_path.relative_to(args.out)),
            }
        )

    write_json(args.out / "manifest.json", manifest)
    print(f"Wrote building prompts to {prompts_dir}")
    print(f"Wrote manifest to {args.out / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
