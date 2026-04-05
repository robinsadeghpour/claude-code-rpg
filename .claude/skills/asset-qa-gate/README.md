# asset-qa-gate

Quality gate for game assets. Validates dimensions, transparency, spritesheet consistency, file size, and naming before assets are promoted into the game.

## Structure

- `SKILL.md`: operator workflow
- `templates/`: dimension rules and QA request contract
- `scripts/`: four UV-compatible validators plus an orchestrator

## Quick workflow

1. `uv run --script scripts/check_dimensions.py --inputs public/assets/tiles/grass-light.png --rules templates/dimension-rules.template.json`
2. `uv run --script scripts/check_transparency.py --inputs public/assets/sprites/npc-mayor.png`
3. `uv run --script scripts/check_spritesheet.py --image public/assets/sprites/player.png --cols 4 --rows 4`
4. `uv run --script scripts/qa_report.py --inputs public/assets/sprites/*.png --rules templates/dimension-rules.template.json --output /tmp/qa-report.json`

## Exit codes

- `0` — all checks pass
- `1` — one or more checks failed
- `2` — invalid arguments or missing files
