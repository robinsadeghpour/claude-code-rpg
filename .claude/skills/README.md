# Claude Code RPG — Skills

Drop these into your project's `.claude/skills/` directory to give Claude Code everything it needs to build the game.

## Installation

```bash
# From your project root
mkdir -p .claude/skills
cp -r brand-and-tone .claude/skills/
cp -r game-architecture .claude/skills/
cp -r generate-npc .claude/skills/
cp -r generate-quest .claude/skills/
cp -r generate-svg-sprite .claude/skills/
cp -r generate-character-sprite .claude/skills/
cp -r generate-building-sprite .claude/skills/
cp -r generate-tile-set .claude/skills/
cp -r generate-prop-sprite .claude/skills/
cp -r asset-metadata-calibration .claude/skills/
cp -r asset-baseline-gate .claude/skills/
cp -r kaplay-core .claude/skills/
```

## Skill Overview

### brand-and-tone (Foundation)
The creative bible. Palettes, tone of voice, metaphor mappings, naming conventions. Every other skill references this one. Read it first.

### game-architecture (Technical)
How the Kaplay + React game is structured. Scene lifecycle, state management, data schemas, and communication patterns. Consult this for system-level game code decisions.

### generate-npc (Content)
Creates NPCs with personality, dialogue trees, sprite specs, and hidden Claude Code concept mappings. Outputs game-ready JSON.

### generate-quest (Content)
Creates quests with terminal challenges, heal moments, and progression logic. Outputs game-ready JSON with solvable riddles.

### generate-svg-sprite (Assets)
Creates pixel art as SVG files using a grid-of-rects approach. Characters, tiles, items, portraits — all generated directly by Claude Code with no external tools.

### generate-character-sprite (Assets Pipeline)
Creates reliable PNG character sprite sheets using JSON prompts + Nano Banana per-frame generation, then local normalization, sheet assembly, and validation scripts.

### generate-building-sprite (Assets Pipeline)
Creates reliable PNG building sprites using JSON prompts + Nano Banana generation, then local normalization and validation scripts.

### generate-tile-set (Assets Pipeline)
Creates reliable terrain/detail tile assets with JSON prompts, normalization, seam validation, and manifest export scripts.

### generate-prop-sprite (Assets Pipeline)
Creates reliable standalone prop sprites with JSON prompts, normalization, validation, and runtime scale recommendation scripts.

### asset-metadata-calibration (Integration Pipeline)
Calibrates scale/anchor/collision/z metadata from generated asset dimensions and exports machine-readable patch payloads.

### asset-baseline-gate (Quality Gate)
Defines baseline asset requirements, checks all runtime assets against quality constraints, and outputs pass/fail status reports.

### kaplay-core (Engine Reference)
Modular KAPLAY engineering guidance with reference notes and project recipes for scenes, sprites, events, and optimization.

## Usage Flow

**To add a new character + quest:**

1. Tell Claude Code: "Create a new NPC that teaches context management, place them in the library area"
2. Claude Code uses `generate-npc` → outputs `src/data/npcs/npc-librarian.json`
3. Tell Claude Code: "Create a quest for the librarian"
4. Claude Code uses `generate-quest` → outputs `src/data/quests/quest-scattered-pages.json`
5. Tell Claude Code: "Generate the librarian's sprite"
6. Claude Code uses `generate-character-sprite` for runtime-ready PNG sheets (or `generate-svg-sprite` when SVG output is explicitly needed)

**To generate a reliable PNG animated character sheet:**

1. Tell Claude Code: "Generate character sheet for npc-mira using generate-character-sprite"
2. Claude Code uses `generate-character-sprite` + `nano-banana` to produce per-frame PNGs
3. Claude Code runs script pipeline to normalize frames and assemble `4x4` sheet
4. Output is validated before being used in `public/assets/sprites/`

**To generate a reliable PNG building sprite:**

1. Tell Claude Code: "Generate a building sprite for forge using generate-building-sprite"
2. Claude Code uses `generate-building-sprite` + `nano-banana` with JSON prompts
3. Claude Code normalizes and validates output PNG(s)
4. Primary output is used as `building-<id>.png` in `public/assets/sprites/`

**To generate reliable tiles and props:**

1. Tell Claude Code: "Generate village tiles with generate-tile-set"
2. Tell Claude Code: "Generate prop sprites for trees and barrels with generate-prop-sprite"
3. Use `asset-metadata-calibration` to produce runtime integration metadata for scale and collision

**To enforce baseline asset quality:**

1. Use `asset-baseline-gate` to extract required assets from `src/game/assets.ts`
2. Run baseline evaluation and summary scripts
3. Treat baseline report errors as release blockers

**To implement gameplay code safely with KAPLAY:**

1. Use `kaplay-core` before modifying `src/game/**`
2. Apply relevant `references/*.mdc` guidance
3. Follow `recipes/*.mdc` for project conventions

**To scaffold the game:**

1. Tell Claude Code: "Set up the project structure for Claude Code RPG"
2. Claude Code uses `game-architecture` → creates the full project scaffold with Kaplay, React, Zustand

**To stay on brand:**

All skills reference `brand-and-tone` automatically. If Claude Code ever generates dialogue with code terms, UI that doesn't match the pixel art vibe, or colors outside the palette — the brand skill catches it.

## What These Skills Don't Cover (Yet)

- **Sound/audio**: Planned for later. For now, find tracks on Epidemic Sound and drop them in `/public/assets/audio/`
- **Tilemap generation**: The game-architecture skill defines the format, but there's no dedicated tilemap builder skill yet. You'll want to use Tiled (free map editor) or build one later.
- **Landing page / parallax**: Covered conceptually in the brief but not as a dedicated skill. The frontend-design patterns in game-architecture are enough to get started.
