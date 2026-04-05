#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""Compare disk, registry, and usage inventories to find sync discrepancies."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def check_naming(filename: str, category: str, naming_rules: dict[str, Any]) -> str | None:
    rule = naming_rules.get(category)
    if not rule:
        return None
    pattern = rule.get("pattern")
    if pattern and not re.match(pattern, filename):
        return f"Does not match {rule.get('description', pattern)}"
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk", type=Path, required=True, help="Output of scan_assets.py")
    parser.add_argument("--registry", type=Path, required=True, help="Output of scan_registry.py")
    parser.add_argument("--usage", type=Path, required=True, help="Output of scan_usage.py")
    parser.add_argument("--config", type=Path, help="Sync config JSON")
    parser.add_argument("--output", type=Path, help="Output JSON report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    disk_data = load_json(args.disk)
    registry_data = load_json(args.registry)
    usage_data = load_json(args.usage)

    config: dict[str, Any] = {}
    if args.config and args.config.exists():
        config = load_json(args.config)
    naming_rules = config.get("naming_rules", {})

    # Build lookup structures
    disk_paths: set[str] = set()
    disk_by_path: dict[str, dict] = {}
    for f in disk_data["files"]:
        if not f.get("ignored", False):
            disk_paths.add(f["path"])
            disk_by_path[f["path"]] = f

    registry_disk_paths: set[str] = set()
    registry_ids: set[str] = set()
    registry_by_id: dict[str, dict] = {}
    registry_by_path: dict[str, dict] = {}
    for e in registry_data["entries"]:
        registry_disk_paths.add(e["disk_path"])
        registry_ids.add(e["sprite_id"])
        registry_by_id[e["sprite_id"]] = e
        registry_by_path[e["disk_path"]] = e

    usage_ids: set[str] = set(usage_data.get("unique_ids", []))
    usage_refs: dict[str, list[str]] = {}
    for ref in usage_data.get("references", []):
        sid = ref["sprite_id"]
        loc = f"{ref['file']}:{ref['line_number']}"
        usage_refs.setdefault(sid, []).append(loc)

    # 1. Orphaned files: on disk but not in registry
    orphaned = []
    for path in sorted(disk_paths - registry_disk_paths):
        f = disk_by_path[path]
        orphaned.append({
            "path": path,
            "category": f["category"],
            "severity": "warning",
            "suggestion": "Register in assets.ts or remove if unused",
        })

    # 2. Stale registrations: in registry but not on disk
    stale = []
    for e in registry_data["entries"]:
        if e["disk_path"] not in disk_paths:
            # Also check if the file simply exists (including ignored ones)
            full_path = Path(e["disk_path"])
            if not full_path.exists():
                stale.append({
                    "sprite_id": e["sprite_id"],
                    "declared_path": e["disk_path"],
                    "line_number": e["line_number"],
                    "severity": "error",
                    "suggestion": "Remove loadSprite call or restore the file",
                })

    # 3. Missing registrations: used in code but not in registry
    missing = []
    for sid in sorted(usage_ids - registry_ids):
        # Skip dynamic/template IDs that contain variable interpolation
        if "${" in sid or "$" in sid:
            continue
        missing.append({
            "sprite_id": sid,
            "used_in": usage_refs.get(sid, []),
            "severity": "error",
            "suggestion": "Add loadSprite call in assets.ts",
        })

    # 4. Unused registrations: in registry but not used in scene/entity code
    unused = []
    for sid in sorted(registry_ids - usage_ids):
        e = registry_by_id[sid]
        unused.append({
            "sprite_id": sid,
            "registered_path": e["disk_path"],
            "severity": "info",
            "suggestion": "Sprite is loaded but never used in scene/entity code",
        })

    # 5. Naming violations
    naming_violations = []
    for f in disk_data["files"]:
        if f.get("ignored"):
            continue
        violation = check_naming(f["filename"], f["category"], naming_rules)
        if violation:
            naming_violations.append({
                "path": f["path"],
                "filename": f["filename"],
                "category": f["category"],
                "expected_pattern": violation,
                "severity": "warning",
            })

    total_errors = len(stale) + len(missing)
    total_warnings = len(orphaned) + len(naming_violations)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "disk_files": len(disk_paths),
            "registered_sprites": len(registry_ids),
            "used_sprite_ids": len(usage_ids),
            "orphaned_files": len(orphaned),
            "stale_registrations": len(stale),
            "missing_registrations": len(missing),
            "unused_registrations": len(unused),
            "naming_violations": len(naming_violations),
            "total_errors": total_errors,
            "total_warnings": total_warnings,
        },
        "orphaned_files": orphaned,
        "stale_registrations": stale,
        "missing_registrations": missing,
        "unused_registrations": unused,
        "naming_violations": naming_violations,
    }

    # Print summary
    print(f"=== Asset Registry Sync Report ===")
    print(f"Disk files:            {len(disk_paths)}")
    print(f"Registered sprites:    {len(registry_ids)}")
    print(f"Used sprite IDs:       {len(usage_ids)}")
    print(f"---")
    print(f"Orphaned files:        {len(orphaned)} (warning)")
    print(f"Stale registrations:   {len(stale)} (error)")
    print(f"Missing registrations: {len(missing)} (error)")
    print(f"Unused registrations:  {len(unused)} (info)")
    print(f"Naming violations:     {len(naming_violations)} (warning)")
    print(f"---")
    print(f"Total errors:          {total_errors}")
    print(f"Total warnings:        {total_warnings}")

    text_out = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text_out, encoding="utf-8")
        print(f"\nFull report written to {args.output}")

    return 1 if total_errors > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
