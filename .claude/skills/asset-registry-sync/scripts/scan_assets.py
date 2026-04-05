#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Scan on-disk asset files and produce a JSON inventory."""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
from datetime import datetime, timezone
from pathlib import Path


IGNORE_PATTERNS = ["**/backup/**", "**/*-original.png", "**/*.svg"]


def matches_ignore(rel_path: str, patterns: list[str]) -> bool:
    for pat in patterns:
        if fnmatch.fnmatch(rel_path, pat):
            return True
    return False


def derive_category(rel_path: str) -> str:
    parts = Path(rel_path).parts
    if parts[0] == "tiles":
        return "tiles"
    if len(parts) >= 2 and parts[0] == "sprites" and parts[1] == "props":
        return "props"
    if parts[0] == "sprites":
        filename = parts[-1]
        if filename.startswith("npc-"):
            return "npcs"
        if filename.startswith("building-"):
            return "buildings"
        if filename.startswith("player"):
            return "player"
        return "sprites"
    return "other"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="Root directory to scan")
    parser.add_argument("--extensions", nargs="+", default=[".png"], help="File extensions to include")
    parser.add_argument("--include-ignored", action="store_true", help="Include ignored files (marked)")
    parser.add_argument("--output", type=Path, help="Output JSON file (stdout if omitted)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    files = []

    for dirpath, _dirnames, filenames in os.walk(root):
        for fname in sorted(filenames):
            full = Path(dirpath) / fname
            ext = full.suffix.lower()
            if ext not in args.extensions and ext not in [".svg"]:
                continue
            rel = str(full.relative_to(root))
            ignored = matches_ignore(rel, IGNORE_PATTERNS) or ext == ".svg"
            if ignored and not args.include_ignored:
                continue
            files.append({
                "path": str(full.relative_to(root.parent.parent)),
                "relative_path": rel,
                "filename": fname,
                "extension": ext,
                "size_bytes": full.stat().st_size,
                "category": derive_category(rel),
                "ignored": ignored,
            })

    files.sort(key=lambda f: f["path"])

    result = {
        "scan_root": str(args.root),
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(files),
        "files": files,
    }

    text = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
        print(f"Wrote {len(files)} files to {args.output}")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
