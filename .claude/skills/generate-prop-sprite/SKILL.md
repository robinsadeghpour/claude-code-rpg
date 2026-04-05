---
name: generate-prop-sprite
description: Generate reliable standalone prop sprites via Nano Banana with normalization, validation, and scale guidance.
argument-hint: [prop-id] [size-class]
allowed-tools: Read, Glob, Bash(python3:*), Bash(gemini:*)
disable-model-invocation: false
user-invocable: true
---

# Generate Prop Sprite

Use this skill for props such as trees, rocks, barrels, wells, and bushes.

## Workflow

1. Read `brand-and-tone` and `visual-scaling`.
2. Build prompt JSON files with `build_prop_prompts.py`.
3. Generate one PNG per variant via `nano-banana`.
4. Normalize output via `normalize_prop.py`.
5. Validate via `validate_prop.py`.
6. Compute runtime scale via `recommend_scale.py`.

## Rules

- One centered prop per file.
- Transparent background required.
- Keep silhouette readable at gameplay scale.
