# generate-character-sprite

Reliable character sprite generation pipeline for Claude Code RPG.

This skill standardizes character creation by separating concerns:

- `SKILL.md`: concise operating instructions for the agent
- `templates/`: JSON contracts and defaults for repeatable prompting
- `scripts/`: UV-compatible utilities for prompt prep, cleanup, sheet assembly, and validation

## Why this exists

Single-shot AI sprite sheets are inconsistent. This pipeline generates each frame independently using Nano Banana, then assembles and validates a strict 4x4 layout used by the game engine.

## Output format

- One PNG sprite sheet at `1024x1024`
- 16 frames, each `256x256`
- Rows:
  - Row 0: down (frames 0-3)
  - Row 1: up (frames 4-7)
  - Row 2: right (frames 8-11)
  - Row 3: left (frames 12-15)

## Quick workflow

1. Create character spec JSON from `templates/character-spec.template.json`
2. Create frame plan JSON from `templates/frame-plan.template.json`
3. Build per-frame prompt JSON files:
   - `uv run --script scripts/build_frame_prompts.py --spec ... --plan ... --out ...`
4. Generate each frame with Nano Banana using those prompt JSON files
5. Normalize each frame:
   - `uv run --script scripts/normalize_frame.py ...`
6. Assemble sheet:
   - `uv run --script scripts/assemble_sheet.py ...`
7. Validate output:
   - `uv run --script scripts/validate_sheet.py ...`

## Notes

- Left-facing frames can be generated directly or mirrored from right-facing frames.
- Keep style lock fields stable across all characters for visual consistency.
- This skill is for character sprite production only; generic image generation remains in `nano-banana`.
