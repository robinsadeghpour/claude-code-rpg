# asset-baseline-gate

Reusable quality gate skill for asset consistency across any game/project.

This skill defines a baseline contract, evaluates all required assets against it,
and outputs a machine-readable status report.

## Structure

- `SKILL.md`: concise usage workflow
- `templates/`: baseline manifest + quality profile templates
- `scripts/`: extract requirements, run checks, and summarize status

## Why this skill exists

Most projects fail asset consistency because "looks good" is not encoded. This
skill turns quality into explicit rules:

- required assets list
- per-asset technical constraints
- project-wide quality profile
- pass/fail report

## Quick workflow

1. Create a manifest from your asset registry:
   - `uv run --script scripts/extract_asset_registry.py --source <registry-file> --output <manifest.json>`
2. Fill and tune:
   - `templates/baseline-manifest.template.json`
   - `templates/quality-profile.template.json`
3. Evaluate baseline:
   - `uv run --script scripts/evaluate_baseline.py --manifest <manifest.json> --profile <profile.json> --project-root <root> --output <baseline-status.json>`
4. Generate readable summary:
   - `uv run --script scripts/summarize_baseline.py --status <baseline-status.json> --output <baseline-status.md> --fail-on-errors`

## Output

- `baseline-status.json`: full structured results per asset
- `baseline-status.md`: readable report for review/PRs

## Reuse notes

- Works with any project that maps logical asset keys to file paths.
- Registry extraction currently supports Kaplay-style `loadSprite("key","path")`.
- For other engines, create your own manifest directly from template.
