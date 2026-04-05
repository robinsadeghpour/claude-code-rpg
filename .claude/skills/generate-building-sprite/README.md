# generate-building-sprite

Reliable building sprite pipeline for Claude Code RPG.

This skill mirrors the character-sprite skill structure, but is optimized for static front-facing buildings and optional state variants.

## Structure

- `SKILL.md`: concise agent workflow
- `templates/`: JSON contracts for repeatable prompt quality
- `scripts/`: UV-compatible utilities for prompt generation, normalization, and validation

## Why this exists

Building generation quality drops when prompts are ad hoc. This pipeline enforces:

- consistent style-lock fields
- stable output constraints (pixel art, transparent background, front-facing)
- deterministic cleanup and validation before use in-game

## Output format

- PNG building sprite(s) in `public/assets/sprites/`
- Typical naming:
  - `building-<id>.png` (primary/healthy)
  - `building-<id>-glitched.png` (optional)
  - `building-<id>-healed.png` (optional)

## Quick workflow

1. Copy and fill:
   - `templates/building-spec.template.json`
   - `templates/variant-plan.template.json`
2. Build per-variant prompt JSON:
   - `uv run --script scripts/build_building_prompts.py --spec ... --plan ... --base-template ... --out ...`
3. Generate PNGs via Nano Banana with those prompt JSONs.
4. Normalize each output:
   - `uv run --script scripts/normalize_building.py --input ... --output ...`
5. Validate final sprite(s):
   - `uv run --script scripts/validate_building.py --image ...`

## Notes

- This skill does not assemble sprite sheets; each building is a standalone sprite.
- Keep the same style-lock across all village buildings for cohesion.
- Keep originals when iterating (e.g. `building-forge-original.png`) before replacing active files.
