---
name: asset-qa-gate
description: Use when new or updated assets need quality validation before use — checks dimensions, transparency, spritesheet frame integrity, file size, and naming conventions per asset category.
argument-hint: [asset-path-or-glob] [--category tiles|npcs|buildings|props|player]
allowed-tools: Read, Glob, Bash(python3:*), Bash(uv:*)
disable-model-invocation: false
user-invocable: true
---

# Asset QA Gate

Validate asset quality before committing or promoting into the game.

## Workflow

1. Check dimensions:
   `uv run --script scripts/check_dimensions.py --inputs <paths...> --rules templates/dimension-rules.template.json`
2. Check transparency:
   `uv run --script scripts/check_transparency.py --inputs <paths...>`
3. Check spritesheets (if applicable):
   `uv run --script scripts/check_spritesheet.py --image <path> --cols <n> --rows <n>`
4. Generate full QA report:
   `uv run --script scripts/qa_report.py --inputs <paths...> --rules templates/dimension-rules.template.json --output /tmp/qa-report.json`

## Rules

- All assets must pass dimension checks for their category before use.
- Props, NPCs, and buildings must have meaningful alpha channels.
- Spritesheets must have uniform frame sizes and no fully empty frames.
- Files above 2MB or below 100 bytes are flagged.
- Naming must match project conventions.
