#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Orchestrate all QA checks and produce a unified pass/fail report."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops


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


def opaque_pixel_count(img: Image.Image) -> int:
    alpha = img.split()[3]
    return sum(1 for value in alpha.tobytes() if value > 0)


def check_asset(path: Path, rules: dict[str, Any], category: str | None, spritesheet_config: dict | None) -> dict[str, Any]:
    cat = category or detect_category(str(path))
    cat_rules = rules.get("categories", {}).get(cat, {})

    result: dict[str, Any] = {
        "path": str(path),
        "category": cat,
        "dimensions": {"status": "skip", "reason": "No rules"},
        "transparency": {"status": "skip", "reason": "Not required"},
        "spritesheet": {"status": "skip", "reason": "Not a spritesheet"},
        "file_size": {"status": "skip"},
        "naming": {"status": "skip"},
        "overall_status": "pass",
    }

    if not path.exists():
        result["overall_status"] = "fail"
        result["dimensions"] = {"status": "fail", "errors": [f"File not found: {path}"]}
        return result

    img = Image.open(path).convert("RGBA")
    w, h = img.size
    file_size = path.stat().st_size

    if not cat_rules:
        return result

    # Dimensions
    dim_errors = []
    dim_warnings = []
    exp_w = cat_rules.get("expected_width")
    exp_h = cat_rules.get("expected_height")
    tol = cat_rules.get("tolerance_px", 0)
    if exp_w is not None and exp_h is not None:
        if abs(w - exp_w) > tol or abs(h - exp_h) > tol:
            dim_errors.append(f"Dimensions {w}x{h}, expected {exp_w}x{exp_h}")
    min_w = cat_rules.get("min_width")
    max_w = cat_rules.get("max_width")
    min_h = cat_rules.get("min_height")
    max_h = cat_rules.get("max_height")
    if min_w and w < min_w:
        dim_errors.append(f"Width {w} < min {min_w}")
    if max_w and w > max_w:
        dim_errors.append(f"Width {w} > max {max_w}")
    if min_h and h < min_h:
        dim_errors.append(f"Height {h} < min {min_h}")
    if max_h and h > max_h:
        dim_errors.append(f"Height {h} > max {max_h}")
    if cat_rules.get("require_square") and w != h:
        dim_errors.append(f"Not square: {w}x{h}")
    result["dimensions"] = {
        "status": "fail" if dim_errors else "pass",
        "width": w, "height": h,
        "errors": dim_errors, "warnings": dim_warnings,
    }

    # Transparency
    if cat_rules.get("require_transparency"):
        alpha_data = img.split()[3].tobytes()
        total = w * h
        transparent = sum(1 for a in alpha_data if a == 0)
        ratio = transparent / total if total > 0 else 0
        min_ratio = cat_rules.get("min_transparent_ratio", 0.20)
        trans_errors = []
        if ratio < min_ratio:
            trans_errors.append(f"Transparent ratio {ratio:.2%} below {min_ratio:.0%}")
        result["transparency"] = {
            "status": "fail" if trans_errors else "pass",
            "transparent_ratio": round(ratio, 4),
            "errors": trans_errors,
        }

    # Spritesheet
    ss = spritesheet_config or cat_rules.get("spritesheet")
    if ss:
        cols = ss["cols"]
        rows = ss["rows"]
        fw = w // cols
        fh = h // rows
        ss_errors = []
        if w % cols != 0 or h % rows != 0:
            ss_errors.append(f"Not evenly divisible by {cols}x{rows}")
        else:
            for r in range(rows):
                for c in range(cols):
                    frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
                    if opaque_pixel_count(frame) == 0:
                        ss_errors.append(f"Frame ({c},{r}) is empty")
        result["spritesheet"] = {
            "status": "fail" if ss_errors else "pass",
            "frame_size": {"width": fw, "height": fh},
            "errors": ss_errors,
        }

    # File size
    min_size = cat_rules.get("min_file_size_bytes")
    max_size = cat_rules.get("max_file_size_bytes")
    fs_warnings = []
    if min_size and file_size < min_size:
        fs_warnings.append(f"Size {file_size}B < min {min_size}B")
    if max_size and file_size > max_size:
        fs_warnings.append(f"Size {file_size}B > max {max_size}B")
    result["file_size"] = {"status": "pass", "size_bytes": file_size, "warnings": fs_warnings}

    # Naming
    naming_pattern = cat_rules.get("naming_pattern")
    if naming_pattern:
        matches = bool(re.match(naming_pattern, path.name))
        result["naming"] = {
            "status": "pass" if matches else "warn",
            "pattern": naming_pattern,
        }
        if not matches:
            result["naming"]["warning"] = f"'{path.name}' does not match {naming_pattern}"

    # Overall
    has_errors = False
    for key in ("dimensions", "transparency", "spritesheet"):
        section = result[key]
        if section.get("status") == "fail":
            has_errors = True
            break
    result["overall_status"] = "fail" if has_errors else "pass"
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", type=Path, required=True)
    parser.add_argument("--rules", type=Path, required=True, help="Dimension rules JSON")
    parser.add_argument("--request", type=Path, help="QA request JSON for spritesheet metadata")
    parser.add_argument("--output", type=Path, help="Output JSON report")
    parser.add_argument("--fail-on-warnings", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rules = load_json(args.rules)

    # Load optional request for spritesheet metadata
    request_map: dict[str, dict] = {}
    if args.request and args.request.exists():
        req = load_json(args.request)
        for inp in req.get("inputs", []):
            request_map[inp["path"]] = inp

    results = []
    passed = failed = total_errors = total_warnings = 0

    for img_path in args.inputs:
        req_info = request_map.get(str(img_path), {})
        cat = req_info.get("category")
        ss = req_info.get("spritesheet")
        r = check_asset(img_path, rules, cat, ss)
        results.append(r)
        if r["overall_status"] == "pass":
            passed += 1
        else:
            failed += 1
        for section in ("dimensions", "transparency", "spritesheet"):
            total_errors += len(r[section].get("errors", []))
        for section in ("dimensions", "file_size"):
            total_warnings += len(r[section].get("warnings", []))

    verdict = "FAIL" if failed > 0 else "PASS"
    if args.fail_on_warnings and total_warnings > 0:
        verdict = "FAIL"

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_assets": len(results),
            "passed": passed,
            "failed": failed,
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "verdict": verdict,
        },
        "results": results,
    }

    # Print summary
    print(f"=== Asset QA Report ===")
    print(f"Verdict: {verdict}")
    print(f"Passed: {passed}/{len(results)}")
    print(f"Errors: {total_errors}, Warnings: {total_warnings}")
    print()
    for r in results:
        status = "PASS" if r["overall_status"] == "pass" else "FAIL"
        print(f"[{status}] {r['path']} ({r['category']})")
        for section in ("dimensions", "transparency", "spritesheet"):
            for e in r[section].get("errors", []):
                print(f"  ERROR: {e}")
        for section in ("dimensions", "file_size"):
            for w_ in r[section].get("warnings", []):
                print(f"  WARN:  {w_}")

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"\nFull report: {args.output}")

    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
