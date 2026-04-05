#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Verify alpha channel presence and quality for sprites."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


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


def check_one(path: Path, min_transparent_ratio: float, edge_sample: int) -> dict:
    result = {
        "path": str(path),
        "status": "pass",
        "errors": [],
        "warnings": [],
    }

    if not path.exists():
        result["errors"].append(f"File not found: {path}")
        result["status"] = "fail"
        return result

    img = Image.open(path).convert("RGBA")
    w, h = img.size
    alpha = img.split()[3]
    alpha_data = alpha.tobytes()
    total_pixels = w * h

    # Transparent ratio
    transparent_count = sum(1 for a in alpha_data if a == 0)
    transparent_ratio = transparent_count / total_pixels if total_pixels > 0 else 0
    result["has_alpha_channel"] = True
    result["transparent_ratio"] = round(transparent_ratio, 4)

    if transparent_ratio < min_transparent_ratio:
        result["errors"].append(
            f"Transparent ratio {transparent_ratio:.2%} below minimum {min_transparent_ratio:.0%}"
        )

    # Edge transparency check - sample border pixels
    edge_pixels = []
    for x in range(w):
        for dy in range(min(edge_sample, h)):
            edge_pixels.append(alpha.getpixel((x, dy)))
            edge_pixels.append(alpha.getpixel((x, h - 1 - dy)))
    for y in range(h):
        for dx in range(min(edge_sample, w)):
            edge_pixels.append(alpha.getpixel((dx, y)))
            edge_pixels.append(alpha.getpixel((w - 1 - dx, y)))

    if edge_pixels:
        edge_transparent = sum(1 for a in edge_pixels if a == 0)
        edge_ratio = edge_transparent / len(edge_pixels)
        result["edge_transparency_ratio"] = round(edge_ratio, 4)
        if edge_ratio < 0.50:
            result["warnings"].append(
                f"Edge transparency {edge_ratio:.0%} is low — possible opaque background"
            )

    # Corner check (10x10 blocks)
    corner_size = min(10, w, h)
    corners = {
        "top_left": (0, 0),
        "top_right": (w - corner_size, 0),
        "bottom_left": (0, h - corner_size),
        "bottom_right": (w - corner_size, h - corner_size),
    }
    corner_results = {}
    for name, (cx, cy) in corners.items():
        region = img.crop((cx, cy, cx + corner_size, cy + corner_size))
        region_alpha = region.split()[3].tobytes()
        transparent = sum(1 for a in region_alpha if a == 0)
        corner_results[name] = transparent > len(region_alpha) * 0.5
    result["corner_transparency"] = corner_results

    opaque_corners = sum(1 for v in corner_results.values() if not v)
    if opaque_corners >= 3:
        result["warnings"].append("3+ corners are opaque — likely has opaque background")

    if result["errors"]:
        result["status"] = "fail"
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", type=Path, required=True)
    parser.add_argument("--min-transparent-ratio", type=float, default=0.20)
    parser.add_argument("--edge-sample-size", type=int, default=5)
    parser.add_argument("--report", type=Path, help="Output JSON report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    results = []
    passed = failed = 0

    for img_path in args.inputs:
        r = check_one(img_path, args.min_transparent_ratio, args.edge_sample_size)
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
