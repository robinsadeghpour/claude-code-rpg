# asset-registry-sync

Keep game assets, the sprite registry, and scene code in sync.

Detects four classes of inconsistency:

1. **Orphaned files** — PNGs on disk not loaded in `assets.ts`
2. **Stale registrations** — `loadSprite` calls pointing to missing files
3. **Missing registrations** — `sprite("id")` calls referencing unregistered IDs
4. **Naming violations** — files or IDs that don't match conventions

## Structure

- `SKILL.md`: operator workflow
- `templates/`: sync configuration with naming rules
- `scripts/`: four UV-compatible scripts for scan, parse, grep, and compare

## Quick workflow

1. `uv run --script scripts/scan_assets.py --root public/assets --output /tmp/disk-inventory.json`
2. `uv run --script scripts/scan_registry.py --file src/game/assets.ts --output /tmp/registry-inventory.json`
3. `uv run --script scripts/scan_usage.py --src-dir src/game --output /tmp/usage-inventory.json`
4. `uv run --script scripts/sync_report.py --disk /tmp/disk-inventory.json --registry /tmp/registry-inventory.json --usage /tmp/usage-inventory.json --config templates/sync-config.template.json --output /tmp/sync-report.json`

Exit code 0 = no errors, 1 = discrepancies found.
