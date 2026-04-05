---
name: asset-registry-sync
description: Use when assets may be out of sync — detects orphaned files on disk not loaded in assets.ts, stale loadSprite calls pointing to missing files, sprite IDs used in scenes but not registered, and naming convention violations.
argument-hint: [--category tiles|sprites|props]
allowed-tools: Read, Glob, Grep, Bash(python3:*), Bash(uv:*)
disable-model-invocation: false
user-invocable: true
---

# Asset Registry Sync

Audit consistency between on-disk asset files, the loadSprite registry in `src/game/assets.ts`, and sprite references in scene/entity code.

## Workflow

1. Scan disk inventory:
   `uv run --script scripts/scan_assets.py --root public/assets --output /tmp/disk-inventory.json`
2. Scan registry:
   `uv run --script scripts/scan_registry.py --file src/game/assets.ts --output /tmp/registry-inventory.json`
3. Scan usage:
   `uv run --script scripts/scan_usage.py --src-dir src/game --output /tmp/usage-inventory.json`
4. Generate sync report:
   `uv run --script scripts/sync_report.py --disk /tmp/disk-inventory.json --registry /tmp/registry-inventory.json --usage /tmp/usage-inventory.json --config templates/sync-config.template.json --output /tmp/sync-report.json`
5. Review the report and apply fixes as needed.

## Rules

- Never auto-delete files; only report orphans for human review.
- Backup directories and `-original.png` files are flagged but not treated as errors.
- SVG files in the assets directory are flagged as non-standard.
- Naming conventions are checked per category using patterns from config.
