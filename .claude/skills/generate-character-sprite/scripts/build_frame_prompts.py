#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Build per-frame Nano Banana prompt JSON files from character spec + frame plan."""

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


def build_prompt(
    base_template: dict[str, Any],
    spec: dict[str, Any],
    frame_id: str,
    direction: str,
    pose: str,
    width: int,
    height: int,
) -> dict[str, Any]:
    prompt = deepcopy(base_template)
    prompt["output"]["width"] = width
    prompt["output"]["height"] = height
    prompt["frame"]["id"] = frame_id
    prompt["frame"]["direction"] = direction
    prompt["frame"]["pose"] = pose
    prompt["style_lock"] = spec["style_lock"]
    prompt["subject"] = spec["subject"]
    prompt["character_id"] = spec["character_id"]
    return prompt


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", type=Path, required=True, help="character spec json")
    parser.add_argument("--plan", type=Path, required=True, help="frame plan json")
    parser.add_argument("--base-template", type=Path, required=True, help="base prompt template json")
    parser.add_argument("--out", type=Path, required=True, help="output directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    spec = load_json(args.spec)
    plan = load_json(args.plan)
    base_template = load_json(args.base_template)

    frame_size = plan.get("frame_size", {})
    width = int(frame_size.get("width", 256))
    height = int(frame_size.get("height", 256))

    prompts_dir = args.out / "prompts"
    manifest = {
        "character_id": spec["character_id"],
        "frame_size": {"width": width, "height": height},
        "rows": [],
        "frames": {},
    }

    for row in plan["rows"]:
        direction = row["direction"]
        row_entry: dict[str, Any] = {"direction": direction, "frames": list(row["frames"])}

        if row.get("source") == "mirror-right":
            row_entry["source"] = "mirror-right"
            manifest["rows"].append(row_entry)
            continue

        poses = row.get("poses", [])
        for idx, frame_id in enumerate(row["frames"]):
            pose = poses[idx] if idx < len(poses) else "idle"
            payload = build_prompt(
                base_template=base_template,
                spec=spec,
                frame_id=frame_id,
                direction=direction,
                pose=pose,
                width=width,
                height=height,
            )
            write_json(prompts_dir / f"{frame_id}.json", payload)
            manifest["frames"][frame_id] = f"prompts/{frame_id}.json"

        manifest["rows"].append(row_entry)

    write_json(args.out / "manifest.json", manifest)
    print(f"Wrote prompts to {prompts_dir}")
    print(f"Wrote manifest to {args.out / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
