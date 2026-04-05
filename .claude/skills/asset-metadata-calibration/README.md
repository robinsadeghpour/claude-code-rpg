# asset-metadata-calibration

Metadata pipeline for turning generated assets into reliable runtime values.

This skill helps standardize scale, anchor, collision footprint, and z-layer metadata for asset usage in scenes.

## Structure

- `SKILL.md`: concise workflow
- `templates/`: request and metadata contracts
- `scripts/`: inspect assets, propose metadata, validate output, and export patch payloads

## Quick workflow

1. Fill `templates/calibration-request.template.json`
2. Inspect asset dimensions:
   - `uv run --script scripts/inspect_asset_dimensions.py --inputs <glob...>`
3. Propose metadata:
   - `uv run --script scripts/propose_metadata.py --request ... --output ...`
4. Validate metadata:
   - `uv run --script scripts/validate_metadata.py --metadata ...`
5. Export patch payload:
   - `uv run --script scripts/export_registry_patch.py --metadata ... --output ...`
