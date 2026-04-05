#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Grep scene/entity code for sprite ID references."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


SPRITE_REF_RE = re.compile(r'sprite\(\s*"([^"]+)"')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src-dir", type=Path, required=True, help="Source directory to scan")
    parser.add_argument("--output", type=Path, help="Output JSON file (stdout if omitted)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    references = []
    unique_ids: set[str] = set()

    for ts_file in sorted(args.src_dir.rglob("*.ts")):
        text = ts_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(text.splitlines(), 1):
            for m in SPRITE_REF_RE.finditer(line):
                sprite_id = m.group(1)
                unique_ids.add(sprite_id)
                references.append({
                    "sprite_id": sprite_id,
                    "file": str(ts_file),
                    "line_number": line_num,
                    "context": line.strip(),
                })

    # Also scan .tsx files
    for tsx_file in sorted(args.src_dir.rglob("*.tsx")):
        text = tsx_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(text.splitlines(), 1):
            for m in SPRITE_REF_RE.finditer(line):
                sprite_id = m.group(1)
                unique_ids.add(sprite_id)
                references.append({
                    "sprite_id": sprite_id,
                    "file": str(tsx_file),
                    "line_number": line_num,
                    "context": line.strip(),
                })

    result = {
        "source_dir": str(args.src_dir),
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "total_unique_ids": len(unique_ids),
        "references": references,
        "unique_ids": sorted(unique_ids),
    }

    text_out = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text_out, encoding="utf-8")
        print(f"Found {len(unique_ids)} unique sprite IDs in {len(references)} references")
    else:
        print(text_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
