---
name: generate-tile-set
description: Generate reliable tile textures and overlays via Nano Banana using JSON prompt contracts and seam validation scripts.
argument-hint: [tileset-id] [optional-variant]
allowed-tools: Read, Glob, Bash(python3:*), Bash(gemini:*)
disable-model-invocation: false
user-invocable: true
---

# Generate Tile Set

Use this skill for terrain and detail tile assets.

## Workflow

1. Read `brand-and-tone` for palette constraints.
2. Generate prompts from `templates/` with `build_tile_prompts.py`.
3. Generate tile PNGs via `nano-banana`.
4. Normalize outputs with `normalize_tile.py`.
5. Validate with:
   - `validate_tile.py` (size/transparency/content)
   - `validate_tile_seams.py` (edge continuity)
6. Export manifest with `assemble_tileset_manifest.py`.

## Rules

- Keep tile size consistent within a tileset.
- Use transparent backgrounds for overlays.
- Do not ship tiles that fail seam validation.
