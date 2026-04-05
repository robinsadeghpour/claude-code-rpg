#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Build per-variant prop prompt JSON files."""

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

    w = int(plan.get("output", {}).get("width", 256))
    h = int(plan.get("output", {}).get("height", 256))
    variants = plan.get("variants", [])
    prompts_dir = args.out / "prompts"
    manifest: dict[str, Any] = {"prop_id": spec["prop_id"], "variants": []}

    for variant in variants:
        payload = deepcopy(base)
        payload["output"]["width"] = w
        payload["output"]["height"] = h
        payload["prop"]["id"] = spec["prop_id"]
        payload["prop"]["category"] = spec["category"]
        payload["prop"]["size_class"] = spec["size_class"]
        payload["prop"]["materials"] = spec.get("visual", {}).get("materials", [])
        payload["prop"]["must_keep_details"] = spec.get("visual", {}).get("must_keep_details", [])
        payload["variant"]["id"] = variant["id"]
        payload["variant"]["modifier"] = variant.get("prompt_modifier", "")

        name = f"{spec['prop_id']}{variant.get('filename_suffix', '')}"
        path = prompts_dir / f"{name}.json"
        write_json(path, payload)
        manifest["variants"].append(
            {"id": variant["id"], "name": name, "prompt": str(path.relative_to(args.out))}
        )

    write_json(args.out / "manifest.json", manifest)
    print(f"Wrote {len(manifest['variants'])} prop prompts.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
