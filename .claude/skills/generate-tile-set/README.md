# generate-tile-set

Reliable tile asset pipeline for Claude Code RPG.

This skill creates consistent tile textures and overlays using JSON prompt contracts plus validation scripts.

## Structure

- `SKILL.md`: concise operator workflow
- `templates/`: tileset spec and prompt templates
- `scripts/`: UV-compatible tools for prompt generation, normalization, and validation

## Typical outputs

- `public/assets/tiles/grass-light.png`
- `public/assets/tiles/dirt-center.png`
- `public/assets/tiles/water-edge.png`

## Quick workflow

1. Fill `templates/tileset-spec.template.json`
2. Fill `templates/tile-variant-plan.template.json`
3. Build prompt JSON files:
   - `uv run --script scripts/build_tile_prompts.py --spec ... --plan ... --base-template ... --out ...`
4. Generate tile PNGs with Nano Banana
5. Normalize each tile:
   - `uv run --script scripts/normalize_tile.py --input ... --output ...`
6. Validate dimensions/transparency:
   - `uv run --script scripts/validate_tile.py --image ...`
7. Validate seamless edges:
   - `uv run --script scripts/validate_tile_seams.py --image ...`
8. Emit registry manifest:
   - `uv run --script scripts/assemble_tileset_manifest.py --input-dir ... --output ...`
