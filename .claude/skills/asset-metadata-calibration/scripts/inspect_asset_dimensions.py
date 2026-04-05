#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Inspect image dimensions for one or more asset files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", required=True, help="one or more paths")
    parser.add_argument("--output", type=Path, help="optional output json file")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    items: list[dict[str, object]] = []
    for input_path in args.inputs:
        p = Path(input_path)
        img = Image.open(p)
        items.append({"path": str(p), "width": img.width, "height": img.height})

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8") as f:
            json.dump({"assets": items}, f, indent=2)
            f.write("\n")
        print(f"Wrote {len(items)} records to {args.output}")
    else:
        print(json.dumps({"assets": items}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
