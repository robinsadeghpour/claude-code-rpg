# generate-prop-sprite

Reliable prop sprite pipeline for world objects like trees, rocks, wells, barrels, and bushes.

## Structure

- `SKILL.md`: concise workflow
- `templates/`: prop spec + prompt contracts
- `scripts/`: prompt generation, normalization, validation, and scale recommendation

## Quick workflow

1. Fill `templates/prop-spec.template.json`
2. Fill `templates/prop-variant-plan.template.json`
3. Build prompt files:
   - `uv run --script scripts/build_prop_prompts.py --spec ... --plan ... --base-template ... --out ...`
4. Generate PNGs with Nano Banana
5. Normalize:
   - `uv run --script scripts/normalize_prop.py --input ... --output ...`
6. Validate:
   - `uv run --script scripts/validate_prop.py --image ...`
7. Recommend scale for scene placement:
   - `uv run --script scripts/recommend_scale.py --image ... --size-class ...`
