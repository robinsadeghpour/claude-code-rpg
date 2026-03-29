# Claude Code RPG — Design Spec

## Overview

Claude Code RPG is an open-source, Stardew Valley-style 2D pixel art RPG that teaches developers how to use Claude Code — by having them actually use it. The player clones a repo containing a mostly-working game with intentional bugs. They play the game in the browser, encounter glitched NPCs and broken world areas, then use their real Claude Code instance to find and fix the bugs in the codebase. When they return to the NPC in-game and interact, the game detects the fix and plays a heal moment — restoring color, sound, and life to that part of the world.

The meta-narrative is literal: a developer gets pulled into a broken game and must fix it from the inside out. The player IS that developer. Claude Code IS their tool. The bugs ARE real.

## Core Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Delivery model | Clone-and-fix with real Claude Code | Teaching by doing, not simulating. The narrative becomes literal. |
| Game state at clone | Mostly playable, specific surgical bugs | RPG experience IS the product — it must feel polished. Bugs are targeted, not structural. |
| Fix detection | NPC interaction check | Player returns to NPC after fixing code, interacts, NPC checks game state, heal moment plays. Keeps player in the RPG loop. |
| Game engine | Kaplay | Lightweight, readable API. Players will read and modify this code — approachability matters. |
| Stack | Vite + React + Kaplay | Fast dev server, hot-reload, no backend complexity. |
| Repo type | Standalone (not monorepo) | `git clone → pnpm install → pnpm dev`. No database, no env vars, no API keys. Maximum approachability. |
| Visual style | Stardew Valley pixel art | 16x16 tile grid, 3/4 top-down perspective, warm pastel palette, rich detailed tilesets. |
| State persistence | localStorage | No backend for MVP. Auto-save on quest completion and area transitions. |
| Asset generation | Nano-banana (Gemini) for pixel art | Generate sprites, tilesets, and parallax layers during implementation. |

## The Player Journey

### Phase 1: Discovery (GitHub)

The player finds the repo on GitHub. The README is concise and inviting:

```
git clone <repo>
cd claude-code-rpg && pnpm install
pnpm dev
# Open http://localhost:5173
# Open Claude Code in the same directory
```

Three commands. No database setup. No `.env` file. No API keys. The game just starts.

### Phase 2: The Hook (Title Screen)

The game opens to a Stardew Valley-style parallax title screen — layered pixel art hills, clouds drifting, village silhouettes, warm sky gradients. A subtle scanline/glitch flicker fires every 8-12 seconds. Single CTA: "Enter the Valley."

On click: a 1-second glitch transition (RGB channel split, scanline sweep, brief white flash). The player is "pulled in." No text explains this — the transition IS the story.

### Phase 3: The Village (Core Gameplay)

The player arrives in a warm pixel art village. They can walk freely (WASD/arrows), explore, and interact with NPCs (E/Space/Enter). The world is mostly beautiful and functional — but specific things are visibly wrong:

- An NPC stutters through their dialogue, repeating the same line
- A section of the village is desaturated with glitch overlays
- A bridge is missing, blocking access to a new area
- A fountain has stopped flowing
- An NPC's sprite flickers between states

Each broken thing maps to a real bug in the codebase, which maps to a Claude Code concept.

### Phase 4: The Fix (Real Claude Code)

The player opens Claude Code in the repo directory and describes what they saw in-game:

> "The blacksmith Harlan keeps forgetting the first step of his crafting sequence. He says the preparation step vanishes. Can you help me figure out what's broken?"

Claude Code finds the bug — perhaps a commented-out pre-hook in the crafting system, a missing entry in a quest data file, or a broken import. The player watches Claude Code reason about the codebase, find the issue, and fix it. They learn the concept (e.g., hooks) by seeing it applied to real code.

### Phase 5: The Payoff (Heal Moment)

The player returns to the game (hot-reload has already picked up the code change). They walk back to Harlan and press E to interact. The NPC check system evaluates whether the fix was applied correctly. If yes:

1. Harlan's dialogue shifts — surprise, relief, warmth
2. A heal animation plays — colors bloom outward, glitch effects dissolve, the forge area restores to its healthy palette
3. The signature ascending 3-note chime plays
4. A world change persists — new path unlocks, smoke rises steadily from the forge, the area stays healed
5. Forward progression opens — a new NPC or area becomes accessible

If the fix wasn't applied correctly, Harlan's dialogue gently indicates things still feel off, nudging the player back to Claude Code without punishment.

## Technical Architecture

### Project Structure

```
claude-code-rpg/
├── public/
│   └── assets/
│       ├── sprites/          # Character sprite sheets (PNG)
│       ├── tiles/            # Tilemap images (PNG)
│       ├── audio/            # Music and SFX (MP3/OGG)
│       └── maps/             # Tiled JSON map data
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # React shell wrapping Kaplay canvas
│   ├── game/
│   │   ├── init.ts           # Kaplay game initialization
│   │   ├── scenes/
│   │   │   ├── boot.ts       # Asset preloading
│   │   │   ├── menu.ts       # Title screen with parallax
│   │   │   ├── transition.ts # Glitch pull-in effect
│   │   │   └── world.ts      # Main gameplay scene
│   │   ├── entities/
│   │   │   ├── player.ts     # Player sprite + movement
│   │   │   └── npc.ts        # NPC sprite + interaction zone
│   │   ├── systems/
│   │   │   ├── dialogue.ts   # Dialogue flow management
│   │   │   ├── quest.ts      # Quest state machine + NPC checks
│   │   │   ├── heal.ts       # Heal animation sequences
│   │   │   └── glitch.ts     # Glitch visual/audio effects
│   │   └── utils/
│   │       └── tilemap.ts    # Tilemap loading helpers
│   ├── ui/                   # React overlay components
│   │   ├── dialogue-box.tsx  # NPC dialogue UI
│   │   ├── quest-journal.tsx # Quest log
│   │   └── hud.tsx           # Minimal HUD
│   ├── store/
│   │   ├── game-store.ts     # Zustand store
│   │   └── types.ts          # TypeScript interfaces
│   └── data/
│       ├── npcs/             # NPC definition JSON files
│       ├── quests/           # Quest definition JSON files
│       └── areas/            # Area/tilemap config files
├── .claude/
│   └── skills/               # Claude Code skills for content generation
│       ├── generate-npc/
│       ├── generate-quest/
│       ├── brand-and-tone/
│       ├── game-architecture/
│       └── generate-svg-sprite/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── CLAUDE.md                 # Project instructions for Claude Code
```

### Kaplay Configuration

```typescript
import kaplay from "kaplay";

const k = kaplay({
  width: 800,
  height: 600,
  letterbox: true,           // Maintains aspect ratio with black bars
  pixelDensity: 1,           // Crisp pixel art rendering
  background: [0, 0, 0],
  global: false,             // No global namespace pollution
  buttons: {
    interact: { keyboard: ["e", "space", "enter"] },
    up: { keyboard: ["w", "up"] },
    down: { keyboard: ["s", "down"] },
    left: { keyboard: ["a", "left"] },
    right: { keyboard: ["d", "right"] },
  },
});
```

Key settings:
- `pixelDensity: 1` prevents blurry sprite scaling — critical for pixel art
- `letterbox: true` for responsive 16:9 framing
- `global: false` keeps code clean and importable

### Player Movement

4-directional only (no diagonal — maintains pixel art cleanliness). Movement locks during dialogue and NPC interactions. Walking animation: 4 frames per direction, idle is frame 0.

### NPC Interaction System

NPCs have an interaction zone (area collider, ~32px radius). When the player overlaps and presses the interact button:

1. Check NPC state in Zustand store (`glitched`, `healed`, `normal`)
2. Pull the appropriate dialogue tree from NPC JSON data
3. Freeze player movement
4. Emit event to React layer to render DialogueBox component
5. Dialogue advances on keypress/click
6. At dialogue end, if the NPC has an active quest, run the quest check

### Quest State Machine

```
LOCKED → AVAILABLE → ACTIVE → COMPLETED
```

- **LOCKED**: Quest exists but prerequisites not met (previous quest not completed)
- **AVAILABLE**: NPC is glitched, player can interact to receive the quest
- **ACTIVE**: Player has heard the NPC's story, bug exists in codebase — waiting for fix
- **COMPLETED**: NPC check passed, heal moment played, world state updated

### NPC Check System (Fix Detection)

This is the core mechanic connecting code changes to game events. When the player interacts with a quest-giving NPC while the quest is `ACTIVE`:

1. The quest definition includes a `check` function — a JavaScript function that evaluates whether the bug has been fixed
2. The check runs against the current game state/module state
3. If the check passes → transition to `COMPLETED`, trigger heal sequence
4. If the check fails → NPC delivers a "still feels off" dialogue line, player keeps trying

**How checks work in practice:**

Each quest's bug is a real code defect. The check function tests the resulting behavior, not the code itself. For example:

- **Commented-out pre-hook**: The check tests whether the crafting system's `prepare()` step runs before `forge()`. If it does, the hook was restored.
- **Missing NPC data field**: The check tests whether the NPC's dialogue array has the expected entries. If they're present, the data was fixed.
- **Broken import**: The check tests whether a system function is callable. If it is, the import was restored.

This means there's no single "right" fix — any code change that makes the check pass is valid. Claude Code might fix it differently each time, and that's fine.

**Where checks live**: Each quest JSON file in `src/data/quests/` includes a `checkId` field referencing a named check function registered in `src/game/systems/quest-checks.ts`. This central registry maps check IDs to functions that return `true` (fixed) or `false` (still broken). The check functions import from game systems to test behavior — they never inspect source code directly.

### Kaplay ↔ React Communication

Kaplay runs on a canvas. React renders overlay UI (dialogue, quest journal, HUD). They communicate through Zustand:

- Kaplay game systems read/write to the Zustand store directly
- React components subscribe to store changes and render accordingly
- No custom event emitter needed — Zustand is the single source of truth

### Zustand Store Shape

```typescript
interface GameStore {
  // Player
  playerPosition: { x: number; y: number };
  currentArea: string;

  // NPCs
  npcStates: Record<string, "glitched" | "normal" | "healed">;

  // Quests
  questStates: Record<string, QuestState>;

  // UI
  isDialogueOpen: boolean;
  currentDialogue: DialogueLine[] | null;

  // World
  healedAreas: string[];

  // Actions
  advanceQuest: (questId: string) => void;
  healNPC: (npcId: string) => void;
  healArea: (areaId: string) => void;
  openDialogue: (lines: DialogueLine[]) => void;
  closeDialogue: () => void;

  // Persistence
  saveGame: () => void;
  loadGame: () => void;
}
```

State persists to localStorage via Zustand's `persist` middleware. Auto-save on quest completion.

### Glitch Effects

Glitched areas use visual effects applied via Kaplay shaders or CSS filters:

- **Scanlines**: Repeating 2px horizontal lines at low opacity
- **Color channel split**: Offset red channel 2px left, blue 2px right
- **Sprite stutter**: Glitched NPCs randomly jump to a previous frame every 2-4 seconds
- **Tile corruption**: Specific tiles swap to a "corrupted" variant (purple-tinted, pixel-shifted)
- **Desaturation**: Glitched zones have 40-60% reduced saturation

Heal animations reverse these effects over 1-2 seconds with easing, bloom outward from the fix point, brief white flash, then healthy palette settles.

## Visual Design

### Target Reference

Stardew Valley — specifically:
- Rich, detailed 16x16 pixel tile grids with varied terrain (grass patches, dirt paths, stone, water)
- 3/4 top-down perspective with slight depth on buildings/objects
- Warm, saturated pastel color palette
- Character sprites: 16x32px (1 tile wide, 2 tiles tall), large expressive heads
- Dense environmental detail: flowers, bushes, fences, rocks, trees with multiple variants
- Layered parallax for title screen with sky, clouds, mountains, trees, foreground

### Color Palettes

**Healthy World**: warm cream `#FFF8E7`, soft sage `#C5D5A5`, peach `#FFB088`, lavender `#C4A8D8`, mint `#88D4B0`, sunbeam yellow `#FFE066`, terracotta `#C67B5C`, warm brown `#8B6549`, soft charcoal `#3A3A3A`

**Glitched World**: cyan `#00FFD4` at 30% opacity, magenta `#FF00FF` at 20%, saturation drained 40-60%, electric purple `#9B30FF`, error red `#FF3355`, scanline `rgba(0,0,0,0.08)` every 2px

### Typography

- In-world dialogue: pixel font (Press Start 2P or Munro)
- Terminal/magic UI: monospace pixel font (Silkscreen or IBM Plex Mono small)
- No system fonts anywhere in the game

### Asset Generation Pipeline

All pixel art assets generated via nano-banana (Gemini CLI) during implementation:
- Tileset sheets for each area (grass, path, water, buildings)
- Character sprite sheets (idle, walk 4-dir, glitched variant, healed variant)
- Parallax layers for title screen
- UI elements (dialogue box borders, quest journal frame)
- Glitch effect overlays

## Sound Design

- **Healthy zones**: Lo-fi ambient, gentle wind, birdsong, soft piano
- **Glitched zones**: Same base with stutter effects, bit-crushed artifacts, off-key notes
- **Heal moment**: Signature ascending 3-note warm chime (bell-like)
- **UI**: Soft clicks for dialogue advance, subtle whoosh for menu open/close
- **Implementation**: Howler.js for layered audio with crossfade between healthy/glitched variants

## Content System

### NPC & Quest Data

All NPCs and quests are defined as JSON files in `src/data/`. The game systems automatically load and use these files — adding new content requires no code changes, just new JSON files.

NPCs follow the schema defined in the `generate-npc` skill. Quests follow the schema defined in the `generate-quest` skill. Both are part of the repo's `.claude/skills/` directory, so contributors can use Claude Code to generate new content.

### Concept-to-Metaphor Mapping

From the `brand-and-tone` skill:

| Claude Code Concept | World Metaphor | Example Bug |
|---|---|---|
| CLAUDE.md | The village charter | Charter file is empty — village has no rules, NPCs behave erratically |
| Skills (.md files) | Recipes, scrolls, craft patterns | Baker's recipe scroll is scrambled — baked goods come out wrong |
| Slash commands | Gestures, rituals, spoken phrases | The greeter forgot the welcome gesture — new visitors get ignored |
| Hooks (pre/post) | Preparation and follow-through rituals | Blacksmith skips preparation — forging fails every time |
| Context management | Village memory, town ledger | Mayor's memory resets — can't remember decisions from 5 minutes ago |
| MCP servers | Trade routes, messenger birds | Merchant's supply routes are severed — no goods arrive |
| Plan mode | Architect's table, blueprints | Builder can't read her own blueprints — constructs random structures |
| Agent mode | Helper spirits | The helper spirits are dormant — villagers do everything manually |

### The Golden Rule

In-world content **never** references code, programming, terminals, APIs, functions, or developer tools directly. The game world has its own internal logic. The only place real Claude Code terminology appears is in `[CREATOR NOTE]` blocks in NPC/quest JSON files — private annotations that never render in-game.

## Progression Structure

### MVP Scope: 1 Village, 5-7 Quests

Linear progression with area unlocking:

1. **Village Square** (starting area) — 2 quests (beginner difficulty)
2. **The Forge** (unlocks after quest 1) — 1-2 quests (beginner → intermediate)
3. **The Library** (unlocks after quest 2) — 1-2 quests (intermediate)
4. **Northern Fields** (unlocks after forge + library complete) — 1-2 quests (intermediate → advanced)

Each quest unlocks either a new NPC, a new area, or both. The first quest in each area is always beginner difficulty.

### What's Intentionally Broken (Examples)

These are the actual bugs planted in the codebase:

1. **Quest 1 — "The Missing Charter"** (teaches CLAUDE.md): The village charter file (`src/data/areas/village-charter.json`) is empty. The mayor NPC's dialogue system reads from this file and renders gibberish because there's no content. Fix: populate the charter with the village rules.

2. **Quest 2 — "The Forgotten Preparation"** (teaches hooks): The blacksmith's crafting system has a pre-hook (`prepare()`) that's commented out. The forge sequence skips straight to heating. Fix: uncomment the pre-hook.

3. **Quest 3 — "The Scrambled Scrolls"** (teaches skills): The librarian's skill-scroll data files have corrupted fields — swapped names, missing descriptions. Fix: correct the data in the JSON files.

4. **Quest 4 — "The Broken Routes"** (teaches MCP): The merchant's trade route system has a broken import — the connection module isn't loaded. Fix: restore the import.

5. **Quest 5 — "The Architect's Dilemma"** (teaches plan mode): The builder's blueprint-reading function doesn't parse the plan steps in order. Fix: restore the sequential parsing logic.

### Difficulty Calibration

- **Beginner**: Bug is obvious once you look at the right file. Claude Code finds it immediately. Player learns a concept by seeing a simple, clear example.
- **Intermediate**: Bug requires connecting NPC dialogue clues to the right part of the codebase. Claude Code needs a bit more context from the player.
- **Advanced**: Bug spans multiple files or requires understanding how systems interact. Player needs to synthesize information from multiple NPCs.

## Open Source & Community

### Contributing

The repo ships with Claude Code skills that let contributors generate new content:

- `generate-npc` — Creates a new NPC with personality, dialogue, sprite spec, and concept mapping
- `generate-quest` — Creates a quest with NPC linkage, check function, and heal moment
- `brand-and-tone` — Reference for all creative constraints

A contributor's workflow: fork → use Claude Code with the generate skills to create a new NPC + quest → add the JSON files + plant the corresponding bug → PR.

### CLAUDE.md

The repo's CLAUDE.md file serves dual purpose:
1. It helps Claude Code understand the project when players use it to fix bugs
2. It's part of the game's narrative — the "village charter" that the player restores in Quest 1

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Game engine | Kaplay |
| UI shell | React 19 |
| Build tool | Vite |
| State management | Zustand (with persist middleware) |
| Styling | Tailwind CSS (overlay UI only) |
| Audio | Howler.js |
| Typography | Press Start 2P (dialogue), Silkscreen (terminal) |
| Hosting | Static — runs locally via `pnpm dev` |
| Asset generation | Nano-banana (Gemini CLI) |
| Maps | Tiled map editor → JSON export |
| Package manager | pnpm |
| Language | TypeScript |

## Success Criteria

- Player can `git clone → pnpm install → pnpm dev` in under 60 seconds
- Game boots to a polished title screen with parallax and glitch effects
- Player can walk around, interact with NPCs, and see glitched areas
- Player can use Claude Code to fix at least 5 distinct bugs
- Each fix is detectable via NPC interaction check
- Each successful fix triggers a satisfying heal moment with visual + audio payoff
- Completed quests unlock forward progression
- Game state persists across browser refreshes
- The codebase is readable enough that Claude Code can navigate it and players can understand the fixes
