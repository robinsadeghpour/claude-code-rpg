#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.0.0"]
# ///

"""Evaluate baseline asset quality from manifest and profile."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--profile", type=Path, required=True)
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def calc_transparent_ratio(img: Image.Image) -> float:
    alpha = img.split()[3]
    total = img.width * img.height
    transparent = sum(1 for value in alpha.getdata() if value == 0)
    return transparent / total if total else 0.0


def calc_opaque_count(img: Image.Image) -> int:
    alpha = img.split()[3]
    return sum(1 for value in alpha.getdata() if value > 0)


def edge_mean_abs_diff(img: Image.Image) -> float:
    px = img.convert("RGBA").load()
    left = [px[0, y] for y in range(img.height)]
    right = [px[img.width - 1, y] for y in range(img.height)]
    top = [px[x, 0] for x in range(img.width)]
    bottom = [px[x, img.height - 1] for x in range(img.width)]

    def diff(a: list[tuple[int, int, int, int]], b: list[tuple[int, int, int, int]]) -> float:
        total = 0
        count = min(len(a), len(b))
        for i in range(count):
            total += sum(abs(a[i][c] - b[i][c]) for c in range(4))
        return total / (count * 4) if count else 0.0

    return max(diff(left, right), diff(top, bottom))


def main() -> int:
    args = parse_args()
    manifest = load_json(args.manifest)
    profile = load_json(args.profile)
    defaults = profile.get("defaults", {})
    allowed_formats = set(defaults.get("allowed_formats", [".png"]))
    min_transparent_ratio = float(defaults.get("min_transparent_ratio_when_required", 0.1))
    max_tile_edge_diff = float(defaults.get("max_tile_edge_diff", 35.0))

    results: list[dict[str, Any]] = []
    total_errors = 0
    total_warnings = 0

    for asset in manifest.get("assets", []):
        record = {
            "key": asset["key"],
            "path": asset["path"],
            "kind": asset.get("kind", "asset"),
            "errors": [],
            "warnings": [],
            "metrics": {},
        }
        asset_path = args.project_root / asset["path"]

        if not asset_path.exists():
            record["errors"].append("missing file")
            results.append(record)
            total_errors += 1
            continue

        if asset_path.suffix.lower() not in allowed_formats:
            record["errors"].append(f"unsupported format: {asset_path.suffix.lower()}")

        img = Image.open(asset_path).convert("RGBA")
        record["metrics"]["width"] = img.width
        record["metrics"]["height"] = img.height

        expected = asset.get("required_size", {})
        expected_w = int(expected.get("width", 0))
        expected_h = int(expected.get("height", 0))
        if expected_w > 0 and expected_h > 0 and (img.width != expected_w or img.height != expected_h):
            record["errors"].append(f"invalid size: got {img.width}x{img.height}, expected {expected_w}x{expected_h}")

        opaque = calc_opaque_count(img)
        record["metrics"]["opaque_pixels"] = opaque
        if opaque < int(asset.get("min_opaque_pixels", 0)):
            record["errors"].append(
                f"too few opaque pixels: {opaque} < {int(asset.get('min_opaque_pixels', 0))}"
            )

        if bool(asset.get("require_transparency", False)):
            transparent_ratio = calc_transparent_ratio(img)
            record["metrics"]["transparent_ratio"] = round(transparent_ratio, 4)
            if transparent_ratio < min_transparent_ratio:
                record["errors"].append(
                    f"transparent ratio too low: {transparent_ratio:.3f} < {min_transparent_ratio:.3f}"
                )

        if bool(asset.get("require_seam_check", False)):
            seam_diff = edge_mean_abs_diff(img)
            record["metrics"]["seam_edge_diff"] = round(seam_diff, 3)
            if seam_diff > max_tile_edge_diff:
                record["errors"].append(
                    f"seam diff too high: {seam_diff:.2f} > {max_tile_edge_diff:.2f}"
                )

        total_errors += len(record["errors"])
        total_warnings += len(record["warnings"])
        results.append(record)

    status = {
        "project_name": manifest.get("project_name", "project"),
        "summary": {
            "assets_total": len(results),
            "assets_failed": sum(1 for r in results if r["errors"]),
            "total_errors": total_errors,
            "total_warnings": total_warnings,
        },
        "results": results,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(f"{json.dumps(status, indent=2)}\n", encoding="utf-8")
    print(
        f"Evaluated {status['summary']['assets_total']} assets. "
        f"Failed: {status['summary']['assets_failed']}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
