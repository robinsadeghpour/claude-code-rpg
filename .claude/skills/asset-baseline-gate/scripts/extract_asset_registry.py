#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Extract Kaplay-style loadSprite registry entries into a baseline manifest."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


LOAD_SPRITE_RE = re.compile(
    r'loadSprite\(\s*"(?P<key>[^"]+)"\s*,\s*"(?P<path>/assets/[^"]+)"',
    re.MULTILINE,
)


def infer_kind(path: str) -> str:
    if "/tiles/" in path:
        if any(token in path for token in ("flowers", "mushrooms", "tall-grass")):
            return "tile-overlay"
        return "tile"
    if "/sprites/props/" in path:
        return "prop"
    if "/sprites/" in path and "building-" in path:
        return "building"
    if "/sprites/" in path and ("player" in path or "npc-" in path):
        return "character"
    return "sprite"


def default_constraints(kind: str) -> dict[str, object]:
    if kind == "tile":
        return {
            "required_size": {"width": 256, "height": 256},
            "min_opaque_pixels": 1000,
            "require_transparency": False,
            "require_seam_check": True,
        }
    if kind == "tile-overlay":
        return {
            "required_size": {"width": 256, "height": 256},
            "min_opaque_pixels": 200,
            "require_transparency": True,
            "require_seam_check": False,
        }
    if kind == "building":
        return {
            "required_size": {"width": 0, "height": 0},
            "min_opaque_pixels": 5000,
            "require_transparency": True,
            "require_seam_check": False,
        }
    if kind == "prop":
        return {
            "required_size": {"width": 0, "height": 0},
            "min_opaque_pixels": 300,
            "require_transparency": True,
            "require_seam_check": False,
        }
    return {
        "required_size": {"width": 0, "height": 0},
        "min_opaque_pixels": 300,
        "require_transparency": True,
        "require_seam_check": False,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="registry file (e.g. src/game/assets.ts)")
    parser.add_argument("--output", type=Path, required=True, help="baseline manifest output json")
    parser.add_argument("--project-name", default="project", help="project name in manifest")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    content = args.source.read_text(encoding="utf-8")
    entries = []
    for match in LOAD_SPRITE_RE.finditer(content):
        key = match.group("key")
        asset_path = match.group("path")
        repo_path = f"public{asset_path}"
        kind = infer_kind(asset_path)
        constraints = default_constraints(kind)
        entries.append(
            {
                "key": key,
                "path": repo_path,
                "kind": kind,
                **constraints,
            }
        )

    manifest = {"project_name": args.project_name, "version": 1, "assets": entries}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")
    print(f"Extracted {len(entries)} assets to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
