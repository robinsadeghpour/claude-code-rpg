---
name: game-architecture
description: "Technical architecture skill for Claude Code RPG. Consult this skill whenever writing game code, creating scenes, wiring up quests, handling player movement, building the dialogue system, or making any architectural decisions about the game engine. Covers Kaplay scene structure, entity/component patterns, state management with Zustand, NPC interaction systems, and quest state machines. Use this alongside brand-and-tone for any implementation work."
---

# Claude Code RPG — Game Architecture

This skill defines how the game is built. Follow these patterns for all implementation work. Always consult the `brand-and-tone` skill for visual and creative constraints.

Use `kaplay-core` for day-to-day KAPLAY API guidance (scenes, events, sprites, optimization). Use this skill for system-level architecture and project structure decisions.

## Tech Stack

- **Game engine**: Kaplay (canvas 2D renderer, `global: false` mode)
- **UI shell**: React + Vite (TypeScript)
- **State management**: Zustand (game state, quest progress, NPC states, dialogue)
- **Styling**: Tailwind CSS for React overlay UI (HUD, dialogue box, quest journal)
- **Hosting**: Vercel (static)
- **No backend** — all state in localStorage via Zustand `persist` middleware

## Project Structure

```
claude-code-rpg/
├── public/
│   └── assets/
│       ├── sprites/          # PNG sprite sheets and individual sprites
│       │   └── props/        # Prop sprites (trees, barrels, etc.)
│       └── tiles/            # Terrain tile images (256x256 PNG)
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # React shell — mounts canvas, calls initGame()
│   ├── game/
│   │   ├── init.ts           # Kaplay initialization, scene registration
│   │   ├── assets.ts         # loadAssets(k) — all k.loadSprite() calls
│   │   ├── loader.ts         # getNPCsForArea(areaId) — data loader
│   │   ├── scenes/
│   │   │   ├── menu.ts       # menuScene(k) — title screen with parallax
│   │   │   ├── transition.ts # transitionScene(k) — glitch transition
│   │   │   └── world.ts      # worldScene(k) — main gameplay
│   │   ├── entities/
│   │   │   ├── player.ts     # spawnPlayer(k, x, y) → { obj, setInteracting }
│   │   │   └── npc.ts        # spawnNPC(k, data) → npcBody game object
│   │   └── systems/
│   │       ├── glitch.ts     # addGlitchOverlay(k, x, y, w, h)
│   │       └── quest.ts      # tryCompleteQuest(questId) → boolean
│   ├── store/
│   │   ├── game-store.ts     # Zustand store (useGameStore)
│   │   └── types.ts          # TypeScript interfaces
│   └── ui/                   # React overlay components
│       ├── hud.tsx
│       ├── quest-journal.tsx
│       ├── dialogue-box.tsx
│       └── heal-overlay.tsx
```

## Kaplay Initialization

```typescript
// src/game/init.ts
import kaplay from "kaplay";
import { loadAssets } from "./assets";

export function initGame(canvas: HTMLCanvasElement) {
  const k = kaplay({
    canvas,
    width: 800,
    height: 600,
    letterbox: true,
    pixelDensity: 1,
    background: [0, 0, 0],
    global: false,           // CRITICAL: use k.* prefix everywhere, not global
    buttons: {
      interact: { keyboard: ["e", "space", "enter"] },
      up:       { keyboard: ["w", "up"] },
      down:     { keyboard: ["s", "down"] },
      left:     { keyboard: ["a", "left"] },
      right:    { keyboard: ["d", "right"] },
    },
  });

  loadAssets(k);  // Must load before any scene runs

  k.scene("menu",       () => menuScene(k));
  k.scene("transition", () => transitionScene(k));
  k.scene("world",      () => worldScene(k));

  k.go("menu");
  return k;
}
```

Key settings:
- `global: false` — all Kaplay APIs accessed via `k.*`, never as globals
- `letterbox: true` — 800x600 canvas letterboxes in any browser window
- Input is defined as named buttons, not raw key names — use `k.isButtonDown("left")` / `k.onButtonPress("interact")`
- Assets loaded once via `loadAssets(k)` before `k.go()` — no separate boot/preload scene

## Scene Pattern

Scenes are plain functions, not classes:

```typescript
// src/game/scenes/world.ts
import type { KAPLAYCtx } from "kaplay";

export function worldScene(k: KAPLAYCtx) {
  // Build the scene — add objects, register handlers
  k.add([...]);
  k.onUpdate(() => { ... });
  k.onButtonPress("interact", () => { ... });
}
```

Scene transitions: `k.go("scene-name")` — destroys all current objects and runs the new scene function.

## Object / Component System

Everything in Kaplay is composed from component arrays:

```typescript
const obj = k.add([
  k.sprite("player-sprite", { anim: "idle-down" }),  // rendering
  k.pos(x, y),          // position
  k.anchor("center"),   // anchor point
  k.scale(0.21),        // scale — see visual-scaling skill for reference table
  k.area({ scale: 0.5 }),  // collision area (scaled hitbox)
  k.body(),             // physics body (dynamic)
  k.z(5),               // z-depth layer
  "player",             // tag (string) for collision queries
]);

// Static body (for walls, buildings):
k.add([k.rect(85, 160), k.pos(x, y), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(4)]);
```

## Loading Sprites

```typescript
// src/game/assets.ts
import type { KAPLAYCtx } from "kaplay";

export function loadAssets(k: KAPLAYCtx) {
  // Static sprite (no animation)
  k.loadSprite("grass-light", "/assets/tiles/grass-light.png");

  // Animated sprite sheet — sliceX/sliceY cut the sheet into frames
  k.loadSprite("player-sprite", "/assets/sprites/player.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
      "walk-down":  { from: 0,  to: 3,  loop: true, speed: 8 },
      "walk-up":    { from: 4,  to: 7,  loop: true, speed: 8 },
      "walk-right": { from: 8,  to: 11, loop: true, speed: 8 },
      "walk-left":  { from: 12, to: 15, loop: true, speed: 8 },
      "idle-down":  0,
      "idle-up":    4,
      "idle-right": 8,
      "idle-left":  12,
    },
  });
}
```

### Character Sprite Sheet Layout (CRITICAL)

The sprite sheet is a 4-column × 4-row grid (`sliceX: 4, sliceY: 4`). Frame numbers go left-to-right, top-to-bottom.

```
Row 0 (frames  0–3):  walk-DOWN  (front-facing)
Row 1 (frames  4–7):  walk-UP    (back-facing)
Row 2 (frames  8–11): walk-RIGHT (right profile)
Row 3 (frames 12–15): walk-LEFT  (left profile)
```

**Rules:**
- Frame 0 of each row = idle for that direction (used for standing still)
- Every frame in a row MUST face the SAME direction — never mix directions in a row
- Row 2 is RIGHT, Row 3 is LEFT (this is the actual order in `assets.ts` — do not swap)
- Right-facing frames can be horizontally-flipped left-facing frames

## Player Entity

```typescript
// src/game/entities/player.ts
export function spawnPlayer(k: KAPLAYCtx, x: number, y: number) {
  let interacting = false;
  let lastDir = "down";
  let wasMoving = false;

  const player = k.add([
    k.sprite("player-sprite", { anim: "idle-down" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(0.21),        // 212px source * 0.21 ≈ 45px on screen
    k.area({ scale: 0.5 }),
    k.body(),
    k.z(5),
    "player",
  ]);

  player.onUpdate(() => {
    if (interacting) return;

    let dx = 0, dy = 0, dir = lastDir;
    if (k.isButtonDown("left"))  { dx = -1; dir = "left"; }
    else if (k.isButtonDown("right")) { dx = 1; dir = "right"; }
    else if (k.isButtonDown("up"))    { dy = -1; dir = "up"; }
    else if (k.isButtonDown("down"))  { dy = 1; dir = "down"; }

    const isMoving = dx !== 0 || dy !== 0;
    if (isMoving && (!wasMoving || dir !== lastDir)) player.play(`walk-${dir}`);
    if (!isMoving && wasMoving) player.play(`idle-${dir}`);

    wasMoving = isMoving;
    lastDir = dir;
    player.move(dx * 120, dy * 120);  // speed: 120px/s
  });

  return {
    obj: player,
    setInteracting(val: boolean) { interacting = val; },
  };
}
```

- Movement freezes when `interacting = true` (during dialogue)
- 4-directional only — diagonal not supported
- `player.move(dx, dy)` is Kaplay's physics-aware move (respects bodies)

## NPC Entity

```typescript
// src/game/entities/npc.ts
export function spawnNPC(k: KAPLAYCtx, data: NPCData) {
  // Sprite (visual)
  const npcSprite = k.add([
    k.sprite(spriteId),
    k.pos(cx, cy),
    k.anchor("center"),
    k.scale(0.13),   // ~440px source * 0.13 ≈ 57px on screen — see visual-scaling skill
    k.z(5),
  ]);

  // Invisible body (collision + interaction detection)
  const npcBody = k.add([
    k.rect(18, 24),
    k.pos(cx, cy),
    k.anchor("center"),
    k.area({ scale: 2.5 }),   // larger collision zone for interaction
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(5),
    "npc",
    { npcId: data.id, npcData: data, isInteractable: false },
  ]);

  // Show/hide [E] prompt on collision
  npcBody.onCollide("player", () => { prompt.opacity = 1; npcBody.isInteractable = true; });
  npcBody.onCollideEnd("player", () => { prompt.opacity = 0; npcBody.isInteractable = false; });

  return npcBody;
}
```

NPC visual effects:
- **Idle bobbing**: `Math.sin(bobTimer * 1.8) * 1.2` applied to sprite Y each frame via `npcBody.onUpdate()`
- **Glitch flicker**: NPC sprite color set to `#9B30FF` + position jitter every few seconds
- **Healed sparkles**: 3 small rect particles with animated opacity cycling

## World Scene Setup

```typescript
// src/game/scenes/world.ts
export function worldScene(k: KAPLAYCtx) {
  const store = useGameStore.getState();
  store.setInWorld(true);

  // World is 50 cols × 38 rows of 16px tiles = 800×608px
  drawTerrain(k);    // grass base, dirt path, scatter details
  addBuildings(k);   // forge, town hall, library + collision bodies
  addEnvironment(k); // trees, bushes, well, props, pond, fences
  addWorldBounds(k); // invisible 8px border walls
  addAtmosphere(k);  // warm golden-hour color overlay

  const { obj: playerObj, setInteracting } = spawnPlayer(k, store.playerPosition.x, store.playerPosition.y);

  // Camera follows player
  k.onUpdate(() => {
    k.setCamPos(playerObj.pos.x, playerObj.pos.y);
    store.savePosition(playerObj.pos.x, playerObj.pos.y);
  });

  // Spawn NPCs for this area
  const areaNPCs = getNPCsForArea(store.currentArea);
  const npcObjs = areaNPCs.map((npcData) => {
    const liveState = store.npcStates[npcData.id] ?? npcData.state;
    return spawnNPC(k, { ...npcData, state: liveState });
  });

  // Unlock player when dialogue closes
  useGameStore.subscribe((state, prev) => {
    if (prev.isDialogueOpen && !state.isDialogueOpen) setInteracting(false);
  });

  // Interaction handler
  k.onButtonPress("interact", () => {
    const s = useGameStore.getState();
    if (s.isDialogueOpen) { s.advanceDialogue(); return; }

    const nearbyNPC = npcObjs.find((npc) => npc.isInteractable);
    if (!nearbyNPC) return;

    setInteracting(true);
    // ... open dialogue via store
  });
}
```

World dimensions: `COLS=50, ROWS=38, TILE=16` → 800×608px total world.
Camera: `k.setCamPos(x, y)` centers camera on player each frame.

## NPC Interaction System

Flow:
1. Player walks into NPC body's area → `onCollide` fires → `[E]` prompt shown, `isInteractable = true`
2. Player presses `interact` button → `onButtonPress("interact")` in world scene checks `npcObjs.find(n => n.isInteractable)`
3. `setInteracting(true)` freezes player
4. `store.openDialogue(lines)` triggers React `<DialogueBox>` to render
5. Subsequent `interact` presses call `store.advanceDialogue()`
6. When all lines shown, `closeDialogue()` → Zustand subscriber fires → `setInteracting(false)`

Quest interaction:
- On NPC press: check `store.questStates[questId]`
- If `"locked"` → set to `"active"`, show glitched dialogue
- If `"active"` or `"available"` → call `tryCompleteQuest(questId)` which checks check functions
- If passed → show healed dialogue, NPC state updates to `"healed"`

## Quest State Machine

```
locked → active → (tryCompleteQuest) → healed
```

States are `"locked"` (not yet triggered), `"active"` (player has talked to NPC), `"healed"` (quest complete).

```typescript
// store/types.ts
export type QuestState = "locked" | "active" | "available" | "healed";
export type NPCState = "glitched" | "normal" | "healed";
```

## Zustand Store Shape

```typescript
// src/store/game-store.ts
interface GameStore {
  inWorld: boolean;
  setInWorld: (val: boolean) => void;
  playerPosition: { x: number; y: number };
  currentArea: string;                          // e.g. "village-square"

  npcStates: Record<string, NPCState>;
  setNPCState: (npcId: string, state: NPCState) => void;

  questStates: Record<string, QuestState>;
  setQuestState: (questId: string, state: QuestState) => void;

  isDialogueOpen: boolean;
  currentDialogue: DialogueLine[] | null;
  dialogueIndex: number;
  openDialogue: (lines: DialogueLine[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;

  isHealing: boolean;
  healData: { npcId: string; visual: string; audio: string } | null;
  triggerHeal: (npcId: string, visual: string, audio: string) => void;
  finishHeal: () => void;

  healedAreas: string[];
  healArea: (areaId: string) => void;

  savePosition: (x: number, y: number) => void;
}
```

Persisted to localStorage under key `"claude-code-rpg-save"` (position, area, npcStates, questStates, healedAreas).

## Kaplay ↔ React Communication

Kaplay runs on a canvas. React renders overlay UI. They communicate **only through the Zustand store** — no event emitters.

```typescript
// Kaplay writes to store
useGameStore.getState().openDialogue(lines);

// React reads from store
const { isDialogueOpen, currentDialogue, dialogueIndex } = useGameStore();

// Kaplay subscribes to store changes
useGameStore.subscribe((state, prev) => {
  if (prev.isDialogueOpen && !state.isDialogueOpen) {
    setInteracting(false);  // unfreeze player
  }
});
```

This keeps the game engine and UI layer cleanly separated. Kaplay handles physics, sprites, input, and camera. React handles all text UI and overlays.

## Z-Depth Layers

```
z(0)  — terrain base (solid grass rect)
z(1)  — terrain detail (flowers, mushrooms, water)
z(2)  — dirt path
z(3)  — props (well, bushes, barrels)
z(4)  — buildings + building collision bodies
z(5)  — player and NPC bodies
z(6)  — NPC name labels
z(7)  — NPC [E] interaction prompts
z(8)  — healed sparkles
z(10) — trees (above player)
z(20) — full-screen overlays (glitch flash)
```

## Adding New Content

When adding a new NPC or quest:

1. Generate NPC data JSON using the `generate-npc` skill → save to `src/data/npcs/`
2. Generate quest JSON using the `generate-quest` skill → save to `src/data/quests/`
3. Generate sprite PNG using the `generate-svg-sprite` skill → save to `public/assets/sprites/`
4. Register the sprite in `src/game/assets.ts` with `k.loadSprite()`
5. Register NPC in `src/game/loader.ts` so `getNPCsForArea()` returns it
6. Add a check function in `src/game/systems/quest.ts` for `tryCompleteQuest()`

No changes to scenes or entity code needed for content additions — the system is data-driven.
