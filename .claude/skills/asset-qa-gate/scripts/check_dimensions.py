#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Validate image dimensions and file size against category rules."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from PIL import Image


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def detect_category(filepath: str) -> str:
    if "/tiles/" in filepath:
        return "tiles"
    if "/sprites/props/" in filepath:
        return "props"
    if "/sprites/" in filepath:
        fname = filepath.rsplit("/", 1)[-1]
        if fname.startswith("npc-"):
            return "npcs"
        if fname.startswith("building-"):
            return "buildings"
        if fname.startswith("player"):
            return "player"
    return "unknown"


def check_one(path: Path, rules: dict[str, Any], category: str | None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "path": str(path),
        "category": category or detect_category(str(path)),
        "status": "pass",
        "errors": [],
        "warnings": [],
    }
    cat = result["category"]

    if not path.exists():
        result["errors"].append(f"File not found: {path}")
        result["status"] = "fail"
        return result

    cat_rules = rules.get("categories", {}).get(cat)
    if not cat_rules:
        result["warnings"].append(f"No rules defined for category '{cat}'")
        return result

    img = Image.open(path)
    w, h = img.size
    result["width"] = w
    result["height"] = h

    file_size = path.stat().st_size
    result["file_size_bytes"] = file_size

    # Exact dimension check
    exp_w = cat_rules.get("expected_width")
    exp_h = cat_rules.get("expected_height")
    tolerance = cat_rules.get("tolerance_px", 0)
    if exp_w is not None and exp_h is not None:
        if abs(w - exp_w) > tolerance or abs(h - exp_h) > tolerance:
            result["errors"].append(f"Dimensions {w}x{h} do not match expected {exp_w}x{exp_h}")

    # Range check
    min_w = cat_rules.get("min_width")
    max_w = cat_rules.get("max_width")
    min_h = cat_rules.get("min_height")
    max_h = cat_rules.get("max_height")
    if min_w is not None and w < min_w:
        result["errors"].append(f"Width {w} below minimum {min_w}")
    if max_w is not None and w > max_w:
        result["errors"].append(f"Width {w} above maximum {max_w}")
    if min_h is not None and h < min_h:
        result["errors"].append(f"Height {h} below minimum {min_h}")
    if max_h is not None and h > max_h:
        result["errors"].append(f"Height {h} above maximum {max_h}")

    # Square check
    if cat_rules.get("require_square") and w != h:
        result["errors"].append(f"Image is {w}x{h} but must be square")

    # File size check
    min_size = cat_rules.get("min_file_size_bytes")
    max_size = cat_rules.get("max_file_size_bytes")
    if min_size is not None and file_size < min_size:
        result["warnings"].append(f"File size {file_size} bytes is suspiciously small (min {min_size})")
    if max_size is not None and file_size > max_size:
        result["warnings"].append(f"File size {file_size} bytes exceeds maximum {max_size}")

    # Naming check
    naming_pattern = cat_rules.get("naming_pattern")
    if naming_pattern:
        if not re.match(naming_pattern, path.name):
            result["warnings"].append(f"Filename '{path.name}' does not match pattern: {naming_pattern}")

    if result["errors"]:
        result["status"] = "fail"
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", type=Path, required=True, help="Image files to check")
    parser.add_argument("--rules", type=Path, required=True, help="Dimension rules JSON")
    parser.add_argument("--category", type=str, help="Force category for all inputs")
    parser.add_argument("--report", type=Path, help="Output JSON report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rules = load_json(args.rules)
    results = []
    passed = 0
    failed = 0

    for img_path in args.inputs:
        r = check_one(img_path, rules, args.category)
        results.append(r)
        if r["status"] == "pass":
            passed += 1
        else:
            failed += 1

    report = {"total": len(results), "passed": passed, "failed": failed, "results": results}

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    for r in results:
        status = "PASS" if r["status"] == "pass" else "FAIL"
        print(f"[{status}] {r['path']}")
        for e in r.get("errors", []):
            print(f"  ERROR: {e}")
        for w in r.get("warnings", []):
            print(f"  WARN:  {w}")

    print(f"\n{passed}/{len(results)} passed")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
