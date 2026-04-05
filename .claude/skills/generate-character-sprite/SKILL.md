---
name: generate-character-sprite
description: Generate reliable 4x4 character sprite sheets via Nano Banana using JSON prompts and local assembly scripts.
argument-hint: [character-id] [optional-style-anchor-path]
allowed-tools: Read, Glob, Bash(python3:*), Bash(gemini:*)
disable-model-invocation: false
user-invocable: true
---

# Generate Character Sprite

Use this skill when creating or updating playable/NPC character sprite sheets.

Always apply in this order:

1. Read `brand-and-tone` for palette and style constraints.
2. Use `nano-banana` for actual frame image generation.
3. Use local scripts in this skill for prompt generation, normalization, assembly, and validation.

## Required format

- Final sprite sheet: `4x4`, `1024x1024`
- Frame size: `256x256`
- Direction rows:
  - row 0: down
  - row 1: up
  - row 2: right
  - row 3: left

## Workflow

1. Prepare JSON inputs from `templates/`:
   - `character-spec.template.json`
   - `frame-plan.template.json`
2. Build per-frame prompt JSON files:
   - `uv run --script .claude/skills/generate-character-sprite/scripts/build_frame_prompts.py --spec <spec.json> --plan <plan.json> --out <dir>`
3. Generate one PNG per frame with Nano Banana (`down-0`...`left-3`).
4. Normalize each frame:
   - `uv run --script .claude/skills/generate-character-sprite/scripts/normalize_frame.py --input <src.png> --output <dst.png>`
5. Assemble sheet:
   - `uv run --script .claude/skills/generate-character-sprite/scripts/assemble_sheet.py --frames-dir <dir> --output <sheet.png>`
6. Validate:
   - `uv run --script .claude/skills/generate-character-sprite/scripts/validate_sheet.py --sheet <sheet.png>`

## Rules

- Do not trust AI-generated full sheets without frame-by-frame checks.
- Keep style-lock fields unchanged across characters in the same set.
- Prefer mirroring right -> left only when asymmetry is not required.
