---
name: asset-metadata-calibration
description: Calibrate and validate runtime metadata (scale, anchor, collision, z) for generated assets.
argument-hint: [asset-type] [asset-path-or-key]
allowed-tools: Read, Glob, Bash(python3:*)
disable-model-invocation: false
user-invocable: true
---

# Asset Metadata Calibration

Use this skill after asset generation to standardize scene integration metadata.

## Workflow

1. Prepare request JSON from `templates/calibration-request.template.json`.
2. Inspect source dimensions via `inspect_asset_dimensions.py`.
3. Propose metadata via `propose_metadata.py`.
4. Validate with `validate_metadata.py`.
5. Export patch payload with `export_registry_patch.py`.

## Rules

- Store metadata as machine-readable JSON.
- Keep collision footprint in lower sprite region for tall assets.
- Validate before updating runtime asset registries or scene placement values.
