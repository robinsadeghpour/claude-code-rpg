---
name: generate-building-sprite
description: Generate reliable front-facing building sprites via Nano Banana using JSON prompts and local normalization/validation scripts.
argument-hint: [building-id] [optional-reference-image]
allowed-tools: Read, Glob, Bash(python3:*), Bash(gemini:*)
disable-model-invocation: false
user-invocable: true
---

# Generate Building Sprite

Use this skill when creating or updating village buildings.

Always apply in this order:

1. Read `brand-and-tone` for palette and visual identity.
2. Use `nano-banana` for image generation.
3. Use this skill's scripts for prompt generation, cleanup, and validation.

## Required output rules

- Front-facing pixel art (Stardew-like perspective)
- Transparent background
- Single building per file
- No text/watermarks/scene clutter

## Workflow

1. Prepare JSON inputs from `templates/`:
   - `building-spec.template.json`
   - `variant-plan.template.json`
2. Build per-variant prompt JSON files:
   - `uv run --script .claude/skills/generate-building-sprite/scripts/build_building_prompts.py --spec <spec.json> --plan <plan.json> --base-template .claude/skills/generate-building-sprite/templates/nanobanana-building-prompt.template.json --out <dir>`
3. Generate one PNG per variant with Nano Banana.
4. Normalize each output:
   - `uv run --script .claude/skills/generate-building-sprite/scripts/normalize_building.py --input <src.png> --output <dst.png>`
5. Validate each final PNG:
   - `uv run --script .claude/skills/generate-building-sprite/scripts/validate_building.py --image <sprite.png>`

## Rules

- Keep style-lock fields identical across all buildings in the same region.
- Keep original source files before replacement.
- Prefer one approved primary sprite for game runtime (`building-<id>.png`).
