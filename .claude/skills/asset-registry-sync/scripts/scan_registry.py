#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Parse assets.ts and extract loadSprite registrations."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


LOAD_SPRITE_RE = re.compile(r'k\.loadSprite\(\s*"([^"]+)"\s*,\s*"([^"]+)"')


def derive_category(asset_path: str) -> str:
    if "/tiles/" in asset_path:
        return "tiles"
    if "/sprites/props/" in asset_path:
        return "props"
    if "/sprites/" in asset_path:
        fname = asset_path.rsplit("/", 1)[-1]
        if fname.startswith("npc-"):
            return "npcs"
        if fname.startswith("building-"):
            return "buildings"
        if fname.startswith("player"):
            return "player"
        return "sprites"
    return "other"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, required=True, help="Path to assets.ts")
    parser.add_argument("--output", type=Path, help="Output JSON file (stdout if omitted)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    text = args.file.read_text(encoding="utf-8")
    entries = []

    for line_num, line in enumerate(text.splitlines(), 1):
        m = LOAD_SPRITE_RE.search(line)
        if m:
            sprite_id = m.group(1)
            asset_path = m.group(2)
            disk_path = "public" + asset_path
            entries.append({
                "sprite_id": sprite_id,
                "asset_path": asset_path,
                "disk_path": disk_path,
                "line_number": line_num,
                "has_options": "{" in line[m.end():],
                "category": derive_category(asset_path),
            })

    result = {
        "registry_file": str(args.file),
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "total_entries": len(entries),
        "entries": entries,
    }

    text_out = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text_out, encoding="utf-8")
        print(f"Found {len(entries)} loadSprite entries")
    else:
        print(text_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
