#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Render baseline status JSON into a concise markdown report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--status", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fail-on-errors", action="store_true")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    args = parse_args()
    status = load_json(args.status)
    summary = status.get("summary", {})
    rows: list[str] = []
    rows.append(f"# Asset Baseline Status - {status.get('project_name', 'project')}")
    rows.append("")
    rows.append(f"- Assets total: {summary.get('assets_total', 0)}")
    rows.append(f"- Assets failed: {summary.get('assets_failed', 0)}")
    rows.append(f"- Total errors: {summary.get('total_errors', 0)}")
    rows.append(f"- Total warnings: {summary.get('total_warnings', 0)}")
    rows.append("")

    failed = [r for r in status.get("results", []) if r.get("errors")]
    if failed:
        rows.append("## Failed Assets")
        rows.append("")
        for rec in failed:
            rows.append(f"- `{rec.get('key')}` -> `{rec.get('path')}`")
            for err in rec.get("errors", []):
                rows.append(f"  - ERROR: {err}")
            for warn in rec.get("warnings", []):
                rows.append(f"  - WARN: {warn}")
        rows.append("")
    else:
        rows.append("All assets passed baseline checks.")
        rows.append("")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(rows).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote summary to {args.output}")

    if args.fail_on_errors and summary.get("total_errors", 0) > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
