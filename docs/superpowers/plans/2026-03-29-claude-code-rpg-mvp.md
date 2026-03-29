# Claude Code RPG — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable Stardew Valley-style RPG where players use real Claude Code to fix intentional bugs and heal a glitched village.

**Architecture:** Standalone Vite + React app wrapping a Kaplay game canvas. Zustand manages shared state between Kaplay (game logic) and React (overlay UI). All game content is JSON-driven. No backend — localStorage for persistence.

**Tech Stack:** Kaplay, React 19, Vite, Zustand, Tailwind CSS, Howler.js, TypeScript, pnpm

**Spec:** `docs/superpowers/specs/2026-03-29-claude-code-rpg-design.md`

---

## File Structure

```
claude-code-rpg/
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies and scripts
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── assets/
│       ├── sprites/              # Character sprite sheets (PNG)
│       ├── tiles/                # Tilemap tilesets (PNG)
│       ├── maps/                 # Tiled JSON exports
│       ├── audio/                # Music and SFX
│       └── fonts/                # Pixel fonts (Press Start 2P woff2)
├── src/
│   ├── main.tsx                  # React entry — renders App
│   ├── App.tsx                   # Mounts Kaplay canvas + React overlays
│   ├── game/
│   │   ├── init.ts              # Kaplay instance creation + config
│   │   ├── scenes/
│   │   │   ├── boot.ts          # Asset preloading + loading bar
│   │   │   ├── menu.ts          # Title screen with parallax layers
│   │   │   ├── transition.ts    # Glitch pull-in animation
│   │   │   └── world.ts         # Main gameplay scene
│   │   ├── entities/
│   │   │   ├── player.ts        # Player sprite, movement, interaction
│   │   │   └── npc.ts           # NPC sprite, interaction zone, state
│   │   ├── systems/
│   │   │   ├── dialogue.ts      # Dialogue flow controller
│   │   │   ├── quest.ts         # Quest state machine
│   │   │   ├── quest-checks.ts  # Registry of check functions per quest
│   │   │   ├── heal.ts          # Heal animation sequences
│   │   │   └── glitch.ts        # Glitch shader/filter effects
│   │   └── loader.ts            # Loads NPC/quest/area JSON at boot
│   ├── ui/
│   │   ├── dialogue-box.tsx     # Dialogue overlay component
│   │   ├── quest-journal.tsx    # Quest log sidebar
│   │   ├── hud.tsx              # Minimal HUD (area name, interact hint)
│   │   └── heal-overlay.tsx     # Full-screen heal flash/bloom effect
│   ├── store/
│   │   ├── game-store.ts        # Zustand store definition
│   │   └── types.ts             # Shared TypeScript interfaces
│   └── data/
│       ├── npcs/
│       │   ├── npc-mayor.json        # Mayor Bramble — teaches CLAUDE.md
│       │   └── npc-blacksmith.json   # Harlan — teaches hooks
│       ├── quests/
│       │   ├── quest-missing-charter.json    # Quest 1
│       │   └── quest-forgotten-prep.json     # Quest 2
│       └── areas/
│           ├── village-square.json    # Starting area config
│           └── village-charter.json   # The charter file (intentionally empty — Quest 1 bug)
├── .claude/
│   └── skills/                   # Existing skills carry over
├── CLAUDE.md
└── README.md
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Initialize project with pnpm**

```bash
cd /Users/robinsadeghpour/WebstormProjects/claude-code-rpg
# Remove existing monorepo files that conflict with standalone setup
# Keep: .claude/, docs/, prompts/, CLAUDE.md, .git/
```

Create `package.json`:

```json
{
  "name": "claude-code-rpg",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "kaplay": "^4000.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/howler": "^2.2.0",
    "@vitejs/plugin-react": "^4.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create Vite config**

Create `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

- [ ] **Step 3: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create Tailwind + PostCSS config**

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        healthy: {
          cream: "#FFF8E7",
          sage: "#C5D5A5",
          peach: "#FFB088",
          lavender: "#C4A8D8",
          mint: "#88D4B0",
          sunbeam: "#FFE066",
          terracotta: "#C67B5C",
          brown: "#8B6549",
          charcoal: "#3A3A3A",
          gray: "#7A7A7A",
        },
        glitch: {
          cyan: "#00FFD4",
          magenta: "#FF00FF",
          purple: "#9B30FF",
          red: "#FF3355",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"Silkscreen"', "monospace"],
      },
    },
  },
  plugins: [],
};
```

Create `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create entry HTML**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code RPG</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
      #root { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create React entry + App shell**

Create `src/main.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

Create `src/App.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { initGame } from "./game/init";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = initGame(canvasRef.current);
    return () => game.quit();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
```

- [ ] **Step 7: Install dependencies and verify dev server starts**

```bash
pnpm install
pnpm dev
```

Expected: Vite dev server starts on http://localhost:5173, shows blank black page (no game init yet).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html src/main.tsx src/App.tsx
git commit -m "feat: scaffold standalone Vite + React + Kaplay project"
```

---

## Task 2: Kaplay Init + Shared Types + Zustand Store

**Files:**
- Create: `src/game/init.ts`, `src/store/types.ts`, `src/store/game-store.ts`

- [ ] **Step 1: Define shared TypeScript types**

Create `src/store/types.ts`:

```typescript
export type NPCState = "glitched" | "normal" | "healed";
export type QuestState = "locked" | "available" | "active" | "completed";

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  area: string;
  position: { x: number; y: number };
  state: NPCState;
  catchphrase: string;
  personality: {
    trait: string;
    speechPattern: string;
    quirk: string;
  };
  dialogue: {
    glitched: DialogueLine[];
    questGiving: DialogueLine[];
    healed: DialogueLine[];
  };
  sprite: {
    idle: string;
    glitched: string;
    healed: string;
  };
  questId: string | null;
  _creatorNote: string;
}

export interface QuestTerminal {
  prompt: string;
  hints: string[];
  acceptedInputs: string[];
  wrongResponses: string[];
  successMessage: string;
}

export interface HealMoment {
  duration: number;
  visual: string;
  audio: string;
  npcReaction: DialogueLine[];
  worldChange: string;
}

export interface QuestData {
  id: string;
  title: string;
  npcId: string;
  areaId: string;
  state: QuestState;
  description: string;
  checkId: string;
  trigger: {
    type: string;
    condition: string;
  };
  healMoment: HealMoment;
  rewards: {
    unlocksArea?: string;
    unlocksNPC?: string;
    worldChange?: string;
  };
  _creatorNote: {
    concept: string;
    lesson: string;
    realWorldParallel: string;
  };
}

export interface AreaData {
  id: string;
  name: string;
  tilemap: string;
  unlocked: boolean;
  glitched: boolean;
  palette: {
    healthy: string[];
    glitched: string[];
  };
}
```

- [ ] **Step 2: Create Zustand store**

Create `src/store/game-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DialogueLine, NPCState, QuestState } from "./types";

interface GameStore {
  // Player
  playerPosition: { x: number; y: number };
  currentArea: string;

  // NPCs
  npcStates: Record<string, NPCState>;
  setNPCState: (npcId: string, state: NPCState) => void;

  // Quests
  questStates: Record<string, QuestState>;
  setQuestState: (questId: string, state: QuestState) => void;

  // Dialogue UI
  isDialogueOpen: boolean;
  currentDialogue: DialogueLine[] | null;
  dialogueIndex: number;
  openDialogue: (lines: DialogueLine[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;

  // Heal
  isHealing: boolean;
  healData: { npcId: string; visual: string; audio: string } | null;
  triggerHeal: (npcId: string, visual: string, audio: string) => void;
  finishHeal: () => void;

  // World
  healedAreas: string[];
  healArea: (areaId: string) => void;

  // Persistence
  savePosition: (x: number, y: number) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      playerPosition: { x: 400, y: 300 },
      currentArea: "village-square",

      npcStates: {},
      setNPCState: (npcId, state) =>
        set((s) => ({ npcStates: { ...s.npcStates, [npcId]: state } })),

      questStates: {},
      setQuestState: (questId, state) =>
        set((s) => ({ questStates: { ...s.questStates, [questId]: state } })),

      isDialogueOpen: false,
      currentDialogue: null,
      dialogueIndex: 0,
      openDialogue: (lines) =>
        set({ isDialogueOpen: true, currentDialogue: lines, dialogueIndex: 0 }),
      advanceDialogue: () => {
        const { dialogueIndex, currentDialogue } = get();
        if (!currentDialogue) return;
        if (dialogueIndex < currentDialogue.length - 1) {
          set({ dialogueIndex: dialogueIndex + 1 });
        } else {
          set({ isDialogueOpen: false, currentDialogue: null, dialogueIndex: 0 });
        }
      },
      closeDialogue: () =>
        set({ isDialogueOpen: false, currentDialogue: null, dialogueIndex: 0 }),

      isHealing: false,
      healData: null,
      triggerHeal: (npcId, visual, audio) =>
        set({ isHealing: true, healData: { npcId, visual, audio } }),
      finishHeal: () => set({ isHealing: false, healData: null }),

      healedAreas: [],
      healArea: (areaId) =>
        set((s) => ({
          healedAreas: s.healedAreas.includes(areaId)
            ? s.healedAreas
            : [...s.healedAreas, areaId],
        })),

      savePosition: (x, y) => set({ playerPosition: { x, y } }),
    }),
    {
      name: "claude-code-rpg-save",
      partialize: (state) => ({
        playerPosition: state.playerPosition,
        currentArea: state.currentArea,
        npcStates: state.npcStates,
        questStates: state.questStates,
        healedAreas: state.healedAreas,
      }),
    }
  )
);
```

- [ ] **Step 3: Create Kaplay initialization**

Create `src/game/init.ts`:

```typescript
import kaplay from "kaplay";

export function initGame(canvas: HTMLCanvasElement) {
  const k = kaplay({
    canvas,
    width: 800,
    height: 600,
    letterbox: true,
    pixelDensity: 1,
    background: [0, 0, 0],
    global: false,
    buttons: {
      interact: { keyboard: ["e", "space", "enter"] },
      up: { keyboard: ["w", "up"] },
      down: { keyboard: ["s", "down"] },
      left: { keyboard: ["a", "left"] },
      right: { keyboard: ["d", "right"] },
    },
  });

  // Register scenes
  k.scene("boot", () => {
    k.add([k.text("Loading...", { size: 16 }), k.pos(400, 300), k.anchor("center")]);
  });

  k.scene("menu", () => {
    k.add([
      k.text("CLAUDE CODE RPG", { size: 24 }),
      k.pos(400, 250),
      k.anchor("center"),
    ]);
    k.add([
      k.text("Press ENTER to start", { size: 12 }),
      k.pos(400, 320),
      k.anchor("center"),
    ]);
    k.onButtonPress("interact", () => {
      k.go("world");
    });
  });

  k.scene("world", () => {
    k.add([
      k.text("World scene — placeholder", { size: 12 }),
      k.pos(400, 300),
      k.anchor("center"),
    ]);
  });

  k.go("menu");

  return k;
}
```

- [ ] **Step 4: Verify game renders in browser**

```bash
pnpm dev
```

Expected: Browser shows "CLAUDE CODE RPG" title text on black background. Pressing Enter navigates to "World scene — placeholder" text.

- [ ] **Step 5: Commit**

```bash
git add src/game/init.ts src/store/types.ts src/store/game-store.ts
git commit -m "feat: add Kaplay init, Zustand store, shared types"
```

---

## Task 3: Title Screen (Menu Scene)

**Files:**
- Create: `src/game/scenes/menu.ts`
- Modify: `src/game/init.ts` (import and register menu scene)

- [ ] **Step 1: Create menu scene with parallax layers**

Create `src/game/scenes/menu.ts`:

```typescript
import type { KAPLAYCtx } from "kaplay";

export function menuScene(k: KAPLAYCtx) {
  // Sky gradient background
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#FFD4A8")),
    k.z(0),
  ]);

  // Upper sky blend
  k.add([
    k.rect(800, 300),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#8BA4C8")),
    k.opacity(0.4),
    k.z(1),
  ]);

  // Clouds layer (slow drift)
  const cloud1 = k.add([
    k.rect(120, 30, { radius: 15 }),
    k.pos(150, 80),
    k.color(k.Color.fromHex("#FFFFFF")),
    k.opacity(0.6),
    k.z(2),
  ]);
  const cloud2 = k.add([
    k.rect(180, 40, { radius: 20 }),
    k.pos(500, 50),
    k.color(k.Color.fromHex("#FFFFFF")),
    k.opacity(0.4),
    k.z(2),
  ]);

  // Mountain silhouettes (mid-layer)
  // These will be replaced with actual pixel art assets later
  const mountains = k.add([
    k.rect(800, 200),
    k.pos(0, 250),
    k.color(k.Color.fromHex("#6B8F5E")),
    k.z(3),
  ]);

  // Foreground hills
  k.add([
    k.rect(800, 180),
    k.pos(0, 380),
    k.color(k.Color.fromHex("#7DB87A")),
    k.z(4),
  ]);

  // Ground
  k.add([
    k.rect(800, 100),
    k.pos(0, 500),
    k.color(k.Color.fromHex("#5A9A55")),
    k.z(5),
  ]);

  // Title text
  k.add([
    k.text("CLAUDE CODE RPG", { size: 32, font: "monospace" }),
    k.pos(400, 220),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(10),
  ]);

  // Subtitle
  k.add([
    k.text("A developer got stuck in a broken game.", {
      size: 10,
      font: "monospace",
    }),
    k.pos(400, 270),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.z(10),
  ]);

  // CTA button
  const cta = k.add([
    k.rect(240, 40, { radius: 4 }),
    k.pos(400, 340),
    k.anchor("center"),
    k.color(k.Color.fromHex("#3A3A3A")),
    k.z(10),
  ]);
  k.add([
    k.text("Enter the Valley", { size: 12, font: "monospace" }),
    k.pos(400, 340),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(11),
  ]);

  // Cloud drift animation
  k.onUpdate(() => {
    cloud1.pos.x += 0.15;
    cloud2.pos.x += 0.1;
    if (cloud1.pos.x > 850) cloud1.pos.x = -150;
    if (cloud2.pos.x > 850) cloud2.pos.x = -200;
  });

  // Scanline glitch effect (every 8-12 seconds)
  let glitchTimer = k.rand(8, 12);
  let glitching = false;
  let glitchDuration = 0;

  const scanlineOverlay = k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0),
    k.z(20),
  ]);

  k.onUpdate(() => {
    glitchTimer -= k.dt();
    if (glitchTimer <= 0 && !glitching) {
      glitching = true;
      glitchDuration = 0.3;
    }
    if (glitching) {
      glitchDuration -= k.dt();
      scanlineOverlay.opacity = Math.random() * 0.08;
      if (glitchDuration <= 0) {
        glitching = false;
        scanlineOverlay.opacity = 0;
        glitchTimer = k.rand(8, 12);
      }
    }
  });

  // Start game on interact
  k.onButtonPress("interact", () => {
    k.go("transition");
  });
}
```

- [ ] **Step 2: Update init.ts to use the menu scene**

Modify `src/game/init.ts` — replace the inline menu scene with the import:

```typescript
import kaplay from "kaplay";
import { menuScene } from "./scenes/menu";

export function initGame(canvas: HTMLCanvasElement) {
  const k = kaplay({
    canvas,
    width: 800,
    height: 600,
    letterbox: true,
    pixelDensity: 1,
    background: [0, 0, 0],
    global: false,
    buttons: {
      interact: { keyboard: ["e", "space", "enter"] },
      up: { keyboard: ["w", "up"] },
      down: { keyboard: ["s", "down"] },
      left: { keyboard: ["a", "left"] },
      right: { keyboard: ["d", "right"] },
    },
  });

  k.scene("menu", () => menuScene(k));

  k.scene("transition", () => {
    // Placeholder — Task 4
    k.add([k.text("Glitch transition...", { size: 12 }), k.pos(400, 300), k.anchor("center")]);
    k.wait(1, () => k.go("world"));
  });

  k.scene("world", () => {
    // Placeholder — Task 5
    k.add([k.text("World — coming soon", { size: 12 }), k.pos(400, 300), k.anchor("center")]);
  });

  k.go("menu");
  return k;
}
```

- [ ] **Step 3: Verify title screen renders**

```bash
pnpm dev
```

Expected: Parallax title screen with sky gradient, drifting clouds, green hills, "CLAUDE CODE RPG" title, glitch flicker every 8-12s. Pressing Enter goes to transition placeholder.

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/menu.ts src/game/init.ts
git commit -m "feat: add title screen with parallax and glitch flicker"
```

---

## Task 4: Glitch Transition Scene

**Files:**
- Create: `src/game/scenes/transition.ts`
- Modify: `src/game/init.ts` (register transition scene)

- [ ] **Step 1: Create transition scene**

Create `src/game/scenes/transition.ts`:

```typescript
import type { KAPLAYCtx } from "kaplay";

export function transitionScene(k: KAPLAYCtx) {
  // Full screen overlay for the glitch effect
  const overlay = k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#FFFFFF")),
    k.opacity(0),
    k.z(100),
  ]);

  // RGB channel split bars
  const redBar = k.add([
    k.rect(800, 4),
    k.pos(0, 200),
    k.color(255, 0, 0),
    k.opacity(0),
    k.z(99),
  ]);
  const blueBar = k.add([
    k.rect(800, 4),
    k.pos(0, 400),
    k.color(0, 100, 255),
    k.opacity(0),
    k.z(99),
  ]);

  // Scanline sweep
  const scanline = k.add([
    k.rect(800, 2),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0),
    k.z(101),
  ]);

  let elapsed = 0;
  const totalDuration = 1.2;

  k.onUpdate(() => {
    elapsed += k.dt();
    const t = elapsed / totalDuration;

    if (t < 0.3) {
      // Phase 1: RGB channel split bars appear and scatter
      const phase = t / 0.3;
      redBar.opacity = phase * 0.7;
      blueBar.opacity = phase * 0.7;
      redBar.pos.y = 200 + Math.sin(elapsed * 30) * 50;
      blueBar.pos.y = 400 + Math.cos(elapsed * 25) * 60;
    } else if (t < 0.6) {
      // Phase 2: Scanline sweep top to bottom
      const phase = (t - 0.3) / 0.3;
      scanline.opacity = 0.8;
      scanline.pos.y = phase * 600;
      redBar.opacity = 0.7 - phase * 0.7;
      blueBar.opacity = 0.7 - phase * 0.7;
    } else if (t < 0.85) {
      // Phase 3: White flash
      const phase = (t - 0.6) / 0.25;
      scanline.opacity = 0;
      overlay.opacity = phase;
    } else {
      // Phase 4: Fade to black then transition
      const phase = (t - 0.85) / 0.15;
      overlay.color = k.Color.fromHex("#000000");
      overlay.opacity = 1;
      if (phase >= 1) {
        k.go("world");
      }
    }
  });
}
```

- [ ] **Step 2: Register transition scene in init.ts**

Update `src/game/init.ts` to replace the placeholder transition:

```typescript
import { transitionScene } from "./scenes/transition";

// In the initGame function, replace the transition scene registration:
k.scene("transition", () => transitionScene(k));
```

- [ ] **Step 3: Verify transition plays**

Press Enter on title screen. Expected: RGB bars scatter, scanline sweeps down, white flash, fade to black, then world scene loads.

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/transition.ts src/game/init.ts
git commit -m "feat: add glitch transition scene with RGB split and scanline"
```

---

## Task 5: World Scene + Player Movement

**Files:**
- Create: `src/game/scenes/world.ts`, `src/game/entities/player.ts`
- Modify: `src/game/init.ts`

- [ ] **Step 1: Create player entity**

Create `src/game/entities/player.ts`:

```typescript
import type { GameObj, KAPLAYCtx } from "kaplay";

const SPEED = 120;

export function createPlayer(k: KAPLAYCtx, x: number, y: number): GameObj {
  const player = k.add([
    k.rect(16, 24),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.body(),
    k.color(k.Color.fromHex("#4A7FBF")),
    k.z(10),
    "player",
  ]);

  let isInteracting = false;

  player.onUpdate(() => {
    if (isInteracting) {
      player.move(0, 0);
      return;
    }

    let dx = 0;
    let dy = 0;

    if (k.isButtonDown("left")) dx = -1;
    else if (k.isButtonDown("right")) dx = 1;

    if (k.isButtonDown("up")) dy = -1;
    else if (k.isButtonDown("down")) dy = 1;

    // 4-directional: prioritize horizontal
    if (dx !== 0 && dy !== 0) dy = 0;

    player.move(dx * SPEED, dy * SPEED);
  });

  // Expose interaction lock
  (player as any).setInteracting = (v: boolean) => {
    isInteracting = v;
    if (v) player.move(0, 0);
  };

  return player;
}
```

- [ ] **Step 2: Create world scene with a simple village layout**

Create `src/game/scenes/world.ts`:

```typescript
import type { KAPLAYCtx } from "kaplay";
import { createPlayer } from "../entities/player";
import { useGameStore } from "../../store/game-store";

export function worldScene(k: KAPLAYCtx) {
  const store = useGameStore.getState();

  // Ground — grass tiles (placeholder colored grid)
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 38; y++) {
      const shade = (x + y) % 2 === 0 ? "#C5D5A5" : "#B8CA98";
      k.add([
        k.rect(16, 16),
        k.pos(x * 16, y * 16),
        k.color(k.Color.fromHex(shade)),
        k.z(0),
      ]);
    }
  }

  // Dirt path (horizontal, center)
  for (let x = 0; x < 50; x++) {
    for (let y = 17; y < 20; y++) {
      k.add([
        k.rect(16, 16),
        k.pos(x * 16, y * 16),
        k.color(k.Color.fromHex("#D4C4A0")),
        k.z(1),
      ]);
    }
  }

  // Some buildings (placeholder rects)
  // Blacksmith forge
  k.add([
    k.rect(64, 48),
    k.pos(160, 200),
    k.color(k.Color.fromHex("#8B6549")),
    k.area(),
    k.body({ isStatic: true }),
    k.z(5),
    "building",
  ]);

  // Town hall
  k.add([
    k.rect(80, 56),
    k.pos(400, 180),
    k.color(k.Color.fromHex("#9B7555")),
    k.area(),
    k.body({ isStatic: true }),
    k.z(5),
    "building",
  ]);

  // Library
  k.add([
    k.rect(56, 48),
    k.pos(600, 200),
    k.color(k.Color.fromHex("#7A6545")),
    k.area(),
    k.body({ isStatic: true }),
    k.z(5),
    "building",
  ]);

  // World bounds
  k.add([k.rect(800, 4), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
  k.add([k.rect(800, 4), k.pos(0, 596), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
  k.add([k.rect(4, 600), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
  k.add([k.rect(4, 600), k.pos(796, 0), k.area(), k.body({ isStatic: true }), k.opacity(0)]);

  // Player
  const player = createPlayer(k, store.playerPosition.x, store.playerPosition.y);

  // Camera follows player
  k.onUpdate(() => {
    k.camPos(player.pos);
  });

  // Area name HUD
  k.add([
    k.text("Village Square", { size: 10, font: "monospace" }),
    k.pos(10, 10),
    k.fixed(),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(50),
  ]);
}
```

- [ ] **Step 3: Register world scene in init.ts**

Update `src/game/init.ts`:

```typescript
import { worldScene } from "./scenes/world";

// Replace the world scene placeholder:
k.scene("world", () => worldScene(k));
```

- [ ] **Step 4: Verify player can walk around the village**

Expected: After transition, player spawns in a green village with dirt path and building placeholders. WASD/arrows move the player. Camera follows. Buildings block movement.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/world.ts src/game/entities/player.ts src/game/init.ts
git commit -m "feat: add world scene with player movement and village layout"
```

---

## Task 6: NPC Entity + Interaction System

**Files:**
- Create: `src/game/entities/npc.ts`, `src/data/npcs/npc-mayor.json`, `src/data/npcs/npc-blacksmith.json`, `src/game/loader.ts`
- Modify: `src/game/scenes/world.ts`

- [ ] **Step 1: Create NPC JSON data files**

Create `src/data/npcs/npc-mayor.json`:

```json
{
  "id": "mayor",
  "name": "Bramble",
  "role": "Village Mayor",
  "area": "village-square",
  "position": { "x": 420, "y": 300 },
  "state": "glitched",
  "catchphrase": "The charter... what does it say again?",
  "personality": {
    "trait": "Earnest but increasingly confused, like a principal who lost the school handbook",
    "speechPattern": "Starts sentences confidently, then trails off as he realizes he can't remember the details",
    "quirk": "Keeps patting his coat pockets as if searching for something he can't find"
  },
  "dialogue": {
    "glitched": [
      { "speaker": "Bramble", "text": "Ah, welcome to our village! It's called... it's..." },
      { "speaker": "Bramble", "text": "I'm the mayor, I should know these things. But the charter — our founding document..." },
      { "speaker": "Bramble", "text": "It's blank. Every page. I opened it this morning and all the words had just... left." },
      { "speaker": "Bramble", "text": "Without the charter, nobody knows the rules. The baker doesn't know opening hours. The blacksmith forgot safety guidelines." },
      { "speaker": "Bramble", "text": "Could you take a look? The charter should be in the town records. Maybe you can see what I can't." }
    ],
    "questGiving": [
      { "speaker": "Bramble", "text": "The village charter is the document that tells everyone how things work around here." },
      { "speaker": "Bramble", "text": "It should list our village name, our rules, our way of life." },
      { "speaker": "Bramble", "text": "But when I open it now, it's completely empty. Like someone erased the whole thing." },
      { "speaker": "Bramble", "text": "If you could find a way to restore it, everything might start making sense again." }
    ],
    "healed": [
      { "speaker": "Bramble", "text": "I can read it again! The charter — every word, clear as day." },
      { "speaker": "Bramble", "text": "Welcome to Bughollow! ...That's our name. I remember now." },
      { "speaker": "Bramble", "text": "Thank you, friend. A village without its charter is a village without its soul." }
    ]
  },
  "sprite": {
    "idle": "sprite-mayor-idle",
    "glitched": "sprite-mayor-glitched",
    "healed": "sprite-mayor-healed"
  },
  "questId": "missing-charter",
  "_creatorNote": "Teaches CLAUDE.md. The village charter IS the CLAUDE.md file — the foundational document that tells Claude Code how the project works. Without it, nothing in the village functions correctly because there are no instructions. The player will fix this by populating the empty charter file with the village's rules."
}
```

Create `src/data/npcs/npc-blacksmith.json`:

```json
{
  "id": "blacksmith",
  "name": "Harlan",
  "role": "Village Blacksmith",
  "area": "village-square",
  "position": { "x": 180, "y": 300 },
  "state": "glitched",
  "catchphrase": "The iron remembers, even when I don't.",
  "personality": {
    "trait": "Patient, methodical, deeply frustrated by his sudden incompetence",
    "speechPattern": "Speaks in measured sentences. Pauses mid-thought. Trails off when the glitch hits.",
    "quirk": "Taps his hammer on the anvil rhythmically while talking, but the rhythm skips a beat every few taps"
  },
  "dialogue": {
    "glitched": [
      { "speaker": "Harlan", "text": "Ah, hello there. I'd offer you something freshly forged, but..." },
      { "speaker": "Harlan", "text": "My hands know the motions. Heat, fold, strike. But somewhere between starting and striking..." },
      { "speaker": "Harlan", "text": "I just... skip the first part. The preparation. Every single time." },
      { "speaker": "Harlan", "text": "It's like the step that gets everything ready just vanished from my mind." }
    ],
    "questGiving": [
      { "speaker": "Harlan", "text": "You seem like someone who notices things others miss." },
      { "speaker": "Harlan", "text": "There's a pattern to my work. It used to flow — preparation, then the craft." },
      { "speaker": "Harlan", "text": "Now the preparation step just... vanishes. Like it was never there." },
      { "speaker": "Harlan", "text": "Could you take a look at the forge? Something in the sequence is broken." }
    ],
    "healed": [
      { "speaker": "Harlan", "text": "I can feel it. The rhythm — it's back." },
      { "speaker": "Harlan", "text": "Prepare, then forge. How did I ever forget that?" },
      { "speaker": "Harlan", "text": "Thank you, friend. My hands remember again." }
    ]
  },
  "sprite": {
    "idle": "sprite-blacksmith-idle",
    "glitched": "sprite-blacksmith-glitched",
    "healed": "sprite-blacksmith-healed"
  },
  "questId": "forgotten-prep",
  "_creatorNote": "Teaches hooks (pre-command hooks). Harlan's preparation ritual is the metaphor for a pre-hook. His glitch is that the pre-hook is commented out in the crafting system, so the prepare() step gets skipped and forging fails."
}
```

- [ ] **Step 2: Create data loader**

Create `src/game/loader.ts`:

```typescript
import type { NPCData, QuestData } from "../store/types";

// Import NPC data
import mayorData from "../data/npcs/npc-mayor.json";
import blacksmithData from "../data/npcs/npc-blacksmith.json";

// Import Quest data (will be added in Task 7)
// import missingCharterData from "../data/quests/quest-missing-charter.json";
// import forgottenPrepData from "../data/quests/quest-forgotten-prep.json";

export const npcs: Record<string, NPCData> = {
  mayor: mayorData as NPCData,
  blacksmith: blacksmithData as NPCData,
};

export const quests: Record<string, QuestData> = {};

export function getNPC(id: string): NPCData | undefined {
  return npcs[id];
}

export function getQuest(id: string): QuestData | undefined {
  return quests[id];
}

export function getAllNPCs(): NPCData[] {
  return Object.values(npcs);
}

export function getNPCsForArea(areaId: string): NPCData[] {
  return Object.values(npcs).filter((npc) => npc.area === areaId);
}
```

- [ ] **Step 3: Create NPC entity**

Create `src/game/entities/npc.ts`:

```typescript
import type { GameObj, KAPLAYCtx } from "kaplay";
import type { NPCData } from "../../store/types";
import { useGameStore } from "../../store/game-store";

export function createNPC(k: KAPLAYCtx, data: NPCData): GameObj {
  const store = useGameStore.getState();
  const state = store.npcStates[data.id] ?? data.state;

  // NPC sprite (placeholder colored rect)
  const baseColor = state === "healed" ? "#88D4B0" : "#C67B5C";
  const npc = k.add([
    k.rect(16, 24),
    k.pos(data.position.x, data.position.y),
    k.anchor("center"),
    k.area({ scale: k.vec2(2.5, 2.5) }), // Larger interaction zone
    k.body({ isStatic: true }),
    k.color(k.Color.fromHex(baseColor)),
    k.z(10),
    "npc",
    { npcId: data.id, npcData: data },
  ]);

  // Name label above NPC
  k.add([
    k.text(data.name, { size: 8, font: "monospace" }),
    k.pos(data.position.x, data.position.y - 22),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(11),
  ]);

  // Glitch effect for glitched NPCs
  if (state === "glitched") {
    let glitchTimer = k.rand(1, 3);
    npc.onUpdate(() => {
      glitchTimer -= k.dt();
      if (glitchTimer <= 0) {
        // Brief color flash
        npc.color = k.Color.fromHex("#9B30FF");
        k.wait(0.1, () => {
          npc.color = k.Color.fromHex(baseColor);
        });
        glitchTimer = k.rand(1, 3);
      }
    });
  }

  // Interaction prompt when player is near
  const prompt = k.add([
    k.text("[E]", { size: 8, font: "monospace" }),
    k.pos(data.position.x, data.position.y - 34),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.opacity(0),
    k.z(12),
  ]);

  npc.onCollide("player", () => {
    prompt.opacity = 1;
  });

  npc.onCollideEnd("player", () => {
    prompt.opacity = 0;
  });

  return npc;
}
```

- [ ] **Step 4: Add NPCs to world scene**

Modify `src/game/scenes/world.ts` — add NPC spawning after the player creation:

```typescript
import { createNPC } from "../entities/npc";
import { getNPCsForArea } from "../loader";

// After player creation, add:
const areaNPCs = getNPCsForArea("village-square");
const npcEntities: GameObj[] = [];
for (const npcData of areaNPCs) {
  npcEntities.push(createNPC(k, npcData));
}
```

Also add NPC interaction handling in the world scene:

```typescript
// NPC interaction
k.onButtonPress("interact", () => {
  const store = useGameStore.getState();
  if (store.isDialogueOpen) {
    store.advanceDialogue();
    return;
  }

  // Check if player is overlapping any NPC
  for (const npcObj of npcEntities) {
    if (player.isColliding(npcObj)) {
      const npcData = (npcObj as any).npcData as NPCData;
      const npcState = store.npcStates[npcData.id] ?? npcData.state;

      let dialogue: DialogueLine[];
      if (npcState === "healed") {
        dialogue = npcData.dialogue.healed;
      } else if (store.questStates[npcData.questId ?? ""] === "active") {
        // Quest is active — run the check
        dialogue = npcData.dialogue.questGiving;
      } else {
        dialogue = npcData.dialogue.glitched;
        // Mark quest as active after first conversation
        if (npcData.questId) {
          store.setQuestState(npcData.questId, "active");
        }
      }

      (player as any).setInteracting(true);
      store.openDialogue(dialogue);
      break;
    }
  }
});
```

- [ ] **Step 5: Verify NPCs appear and are interactable**

Expected: Mayor Bramble and Harlan appear as colored rectangles in the village. Walking near them shows [E] prompt. Pressing E opens dialogue (store updates, but no visual dialogue box yet — that's Task 8).

- [ ] **Step 6: Commit**

```bash
git add src/game/entities/npc.ts src/game/loader.ts src/data/npcs/ src/game/scenes/world.ts
git commit -m "feat: add NPC entity, data loader, and interaction system"
```

---

## Task 7: Quest System + Check Functions + Quest Data

**Files:**
- Create: `src/game/systems/quest.ts`, `src/game/systems/quest-checks.ts`, `src/data/quests/quest-missing-charter.json`, `src/data/quests/quest-forgotten-prep.json`, `src/data/areas/village-charter.json`, `src/game/systems/crafting.ts`
- Modify: `src/game/loader.ts`, `src/game/scenes/world.ts`

- [ ] **Step 1: Create the intentionally broken files (the bugs)**

Create `src/data/areas/village-charter.json` — **intentionally empty** (this IS the Quest 1 bug):

```json
{}
```

Create `src/game/systems/crafting.ts` — the crafting system with **intentionally commented-out pre-hook** (Quest 2 bug):

```typescript
export interface CraftStep {
  name: string;
  action: () => boolean;
}

// [BUG] The prepare step is commented out.
// The forge sequence skips preparation entirely.
const forgePipeline: CraftStep[] = [
  // { name: "prepare", action: () => prepare() },
  { name: "heat", action: () => heat() },
  { name: "fold", action: () => fold() },
  { name: "strike", action: () => strike() },
  { name: "cool", action: () => cool() },
];

function prepare(): boolean {
  return true;
}

function heat(): boolean {
  return true;
}

function fold(): boolean {
  return true;
}

function strike(): boolean {
  return true;
}

function cool(): boolean {
  return true;
}

export function runForge(): { success: boolean; stepsRun: string[] } {
  const stepsRun: string[] = [];
  for (const step of forgePipeline) {
    const result = step.action();
    stepsRun.push(step.name);
    if (!result) return { success: false, stepsRun };
  }
  return { success: true, stepsRun };
}

export function getForgePipeline(): CraftStep[] {
  return forgePipeline;
}
```

- [ ] **Step 2: Create quest data files**

Create `src/data/quests/quest-missing-charter.json`:

```json
{
  "id": "missing-charter",
  "title": "The Missing Charter",
  "npcId": "mayor",
  "areaId": "village-square",
  "state": "available",
  "description": "Mayor Bramble's village charter is completely blank. Without it, nobody knows the rules.",
  "checkId": "charter-restored",
  "trigger": {
    "type": "npc-dialogue",
    "condition": "Talk to Mayor Bramble"
  },
  "healMoment": {
    "duration": 2500,
    "visual": "The town hall windows glow warm gold. Color ripples outward from the building across the square. The faded signpost sharpens — 'Welcome to Bughollow' appears letter by letter. Flowers around the square bloom in sequence.",
    "audio": "A deep hum resolves into a warm chord. The three-note ascending chime plays. Birds begin singing.",
    "npcReaction": [
      { "speaker": "Bramble", "text": "I can read it again! The charter — every word, clear as day." },
      { "speaker": "Bramble", "text": "Welcome to Bughollow! ...That's our name. I remember now." }
    ],
    "worldChange": "Town hall restored to healthy palette. Village signpost now readable. Path to the forge area brightens."
  },
  "rewards": {
    "unlocksArea": "forge",
    "unlocksNPC": null,
    "worldChange": "Village square fully restored. Signpost shows village name."
  },
  "_creatorNote": {
    "concept": "CLAUDE.md",
    "lesson": "CLAUDE.md is the foundational document that tells Claude Code how a project works — its structure, conventions, and rules. Without it, Claude Code operates without context, like a village without its charter.",
    "realWorldParallel": "In Claude Code, CLAUDE.md sits at the project root and provides critical context: architecture patterns, coding conventions, build commands, and project-specific instructions."
  }
}
```

Create `src/data/quests/quest-forgotten-prep.json`:

```json
{
  "id": "forgotten-prep",
  "title": "The Forgotten Preparation",
  "npcId": "blacksmith",
  "areaId": "village-square",
  "state": "locked",
  "description": "Harlan the blacksmith can't forge anything — the preparation step keeps vanishing from his routine.",
  "checkId": "forge-prep-restored",
  "trigger": {
    "type": "npc-dialogue",
    "condition": "Talk to Harlan after completing The Missing Charter"
  },
  "healMoment": {
    "duration": 2000,
    "visual": "Harlan's anvil stops flickering. Color spreads outward from the forge — warm orange and gold ripple across the floor. Scattered tools lift and settle into their proper places. Harlan's hammer lands firmly in his hand and stays.",
    "audio": "Forge crackling normalizes from stuttery to steady rhythm. Three-note ascending chime plays. Ambient warmth increases.",
    "npcReaction": [
      { "speaker": "Harlan", "text": "I can feel it. The rhythm — it's back." },
      { "speaker": "Harlan", "text": "Prepare, then forge. How did I ever forget that?" }
    ],
    "worldChange": "Forge area restored to healthy palette. Anvil no longer flickers. Smoke rises steadily."
  },
  "rewards": {
    "unlocksArea": "library",
    "unlocksNPC": null,
    "worldChange": "Forge area fully restored"
  },
  "_creatorNote": {
    "concept": "Hooks (pre-command hooks)",
    "lesson": "Pre-hooks run before the main command executes. They set up conditions, validate state, or prepare context. Without them, the main action may fail or produce unexpected results.",
    "realWorldParallel": "In Claude Code, hooks can run before or after tool calls — validating state, running linters, or checking conditions before actions execute."
  }
}
```

- [ ] **Step 3: Create quest check functions**

Create `src/game/systems/quest-checks.ts`:

```typescript
import charterData from "../../data/areas/village-charter.json";
import { getForgePipeline } from "./crafting";

type QuestCheck = () => boolean;

const checks: Record<string, QuestCheck> = {
  "charter-restored": () => {
    // Check if the village charter has been populated
    // The charter file starts empty ({}) — the player needs to add content
    const keys = Object.keys(charterData);
    return keys.length > 0 && "name" in charterData;
  },

  "forge-prep-restored": () => {
    // Check if the forge pipeline includes a "prepare" step
    const pipeline = getForgePipeline();
    return pipeline.some((step) => step.name === "prepare");
  },
};

export function runQuestCheck(checkId: string): boolean {
  const check = checks[checkId];
  if (!check) {
    console.warn(`No check function found for checkId: ${checkId}`);
    return false;
  }
  return check();
}
```

- [ ] **Step 4: Create quest state machine**

Create `src/game/systems/quest.ts`:

```typescript
import type { QuestData, QuestState } from "../../store/types";
import { useGameStore } from "../../store/game-store";
import { runQuestCheck } from "./quest-checks";
import { quests } from "../loader";

export function getQuestState(questId: string): QuestState {
  const store = useGameStore.getState();
  return store.questStates[questId] ?? "locked";
}

export function tryCompleteQuest(questId: string): boolean {
  const quest = quests[questId];
  if (!quest) return false;

  const state = getQuestState(questId);
  if (state !== "active") return false;

  const passed = runQuestCheck(quest.checkId);
  if (passed) {
    const store = useGameStore.getState();
    store.setQuestState(questId, "completed");
    store.setNPCState(quest.npcId, "healed");
    store.triggerHeal(quest.npcId, quest.healMoment.visual, quest.healMoment.audio);

    // Unlock next quests based on rewards
    if (quest.rewards.unlocksArea) {
      store.healArea(quest.rewards.unlocksArea);
    }

    // Unlock dependent quests
    for (const q of Object.values(quests)) {
      if (q.state === "locked") {
        // Simple: unlock quests in the same area or newly unlocked area
        const qState = store.questStates[q.id];
        if (!qState || qState === "locked") {
          store.setQuestState(q.id, "available");
        }
      }
    }

    return true;
  }

  return false;
}
```

- [ ] **Step 5: Update loader to include quests**

Modify `src/game/loader.ts` to import and export quest data:

```typescript
import missingCharterData from "../data/quests/quest-missing-charter.json";
import forgottenPrepData from "../data/quests/quest-forgotten-prep.json";

export const quests: Record<string, QuestData> = {
  "missing-charter": missingCharterData as unknown as QuestData,
  "forgotten-prep": forgottenPrepData as unknown as QuestData,
};
```

- [ ] **Step 6: Wire quest checks into NPC interaction in world scene**

Update the NPC interaction handler in `src/game/scenes/world.ts` to call `tryCompleteQuest`:

```typescript
import { tryCompleteQuest } from "../systems/quest";

// In the interact handler, when quest is active:
if (npcData.questId && store.questStates[npcData.questId] === "active") {
  const completed = tryCompleteQuest(npcData.questId);
  if (completed) {
    dialogue = npcData.dialogue.healed;
  } else {
    dialogue = [
      { speaker: npcData.name, text: "Something still feels off... Maybe the fix isn't quite right yet." },
      ...npcData.dialogue.questGiving,
    ];
  }
}
```

- [ ] **Step 7: Verify quest check system works**

Test: Talk to Mayor → dialogue plays, quest becomes active. Manually edit `village-charter.json` to add `"name": "Bughollow"`. Talk to Mayor again → healed dialogue plays if check passes.

- [ ] **Step 8: Commit**

```bash
git add src/game/systems/ src/data/ src/game/loader.ts src/game/scenes/world.ts
git commit -m "feat: add quest system with check functions and intentional bugs"
```

---

## Task 8: Dialogue Box UI (React Overlay)

**Files:**
- Create: `src/ui/dialogue-box.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create dialogue box component**

Create `src/ui/dialogue-box.tsx`:

```tsx
import { useGameStore } from "../store/game-store";

export function DialogueBox() {
  const isOpen = useGameStore((s) => s.isDialogueOpen);
  const dialogue = useGameStore((s) => s.currentDialogue);
  const index = useGameStore((s) => s.dialogueIndex);
  const advance = useGameStore((s) => s.advanceDialogue);

  if (!isOpen || !dialogue || !dialogue[index]) return null;

  const line = dialogue[index];
  const isLast = index === dialogue.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          advance();
        }}
        style={{
          pointerEvents: "auto",
          background: "#1a1a2e",
          border: "3px solid #FFE066",
          borderRadius: "4px",
          padding: "16px 20px",
          maxWidth: "700px",
          width: "100%",
          cursor: "pointer",
          fontFamily: '"Press Start 2P", monospace',
          imageRendering: "pixelated",
        }}
      >
        <div
          style={{
            color: "#FFE066",
            fontSize: "10px",
            marginBottom: "8px",
            lineHeight: 1,
          }}
        >
          {line.speaker}
        </div>
        <div
          style={{
            color: "#e0e0e0",
            fontSize: "11px",
            lineHeight: 1.8,
          }}
        >
          {line.text}
        </div>
        <div
          style={{
            color: "#7A7A7A",
            fontSize: "8px",
            marginTop: "10px",
            textAlign: "right",
          }}
        >
          {isLast ? "▼ Close" : "▼ Continue"}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount dialogue box in App**

Modify `src/App.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { initGame } from "./game/init";
import { DialogueBox } from "./ui/dialogue-box";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = initGame(canvasRef.current);
    return () => game.quit();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas ref={canvasRef} />
      <DialogueBox />
    </div>
  );
}
```

- [ ] **Step 3: Ensure player movement unlocks when dialogue closes**

In `src/game/scenes/world.ts`, add a store subscription to unlock player movement when dialogue closes:

```typescript
// After player creation, subscribe to dialogue state
useGameStore.subscribe(
  (state) => state.isDialogueOpen,
  (isOpen) => {
    (player as any).setInteracting(isOpen);
  }
);
```

- [ ] **Step 4: Verify dialogue box shows and cycles through lines**

Expected: Walk to NPC, press E, dialogue box appears at bottom of screen with speaker name and text. Click or press E to advance. After last line, dialogue closes and player can move again.

- [ ] **Step 5: Commit**

```bash
git add src/ui/dialogue-box.tsx src/App.tsx src/game/scenes/world.ts
git commit -m "feat: add dialogue box overlay with typewriter-style interaction"
```

---

## Task 9: Heal Overlay + Heal Animation System

**Files:**
- Create: `src/ui/heal-overlay.tsx`, `src/game/systems/heal.ts`
- Modify: `src/App.tsx`, `src/game/scenes/world.ts`

- [ ] **Step 1: Create heal overlay component**

Create `src/ui/heal-overlay.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useGameStore } from "../store/game-store";

export function HealOverlay() {
  const isHealing = useGameStore((s) => s.isHealing);
  const healData = useGameStore((s) => s.healData);
  const finishHeal = useGameStore((s) => s.finishHeal);
  const [phase, setPhase] = useState<"flash" | "bloom" | "settle" | "done">("flash");
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!isHealing) {
      setPhase("flash");
      setOpacity(0);
      return;
    }

    // Phase 1: White flash (200ms)
    setPhase("flash");
    setOpacity(1);

    const t1 = setTimeout(() => {
      // Phase 2: Color bloom (1000ms)
      setPhase("bloom");
      setOpacity(0.6);
    }, 200);

    const t2 = setTimeout(() => {
      // Phase 3: Settle (800ms)
      setPhase("settle");
      setOpacity(0.3);
    }, 1200);

    const t3 = setTimeout(() => {
      // Done
      setPhase("done");
      setOpacity(0);
      finishHeal();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isHealing, finishHeal]);

  if (!isHealing) return null;

  const backgrounds: Record<string, string> = {
    flash: "rgba(255, 255, 255, 1)",
    bloom: "radial-gradient(circle at center, rgba(255, 224, 102, 0.8) 0%, rgba(136, 212, 176, 0.4) 60%, transparent 100%)",
    settle: "radial-gradient(circle at center, rgba(136, 212, 176, 0.3) 0%, transparent 80%)",
    done: "transparent",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: backgrounds[phase],
        opacity,
        transition: "opacity 0.3s ease, background 0.5s ease",
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 2: Mount heal overlay in App**

Modify `src/App.tsx` to add `<HealOverlay />`:

```tsx
import { HealOverlay } from "./ui/heal-overlay";

// In the return JSX, add after DialogueBox:
<HealOverlay />
```

- [ ] **Step 3: Verify heal overlay triggers on quest completion**

Test: Edit `village-charter.json` to have content, talk to Mayor → quest completes → white flash, gold/green bloom radiates, settles, overlay disappears.

- [ ] **Step 4: Commit**

```bash
git add src/ui/heal-overlay.tsx src/App.tsx
git commit -m "feat: add heal moment overlay with flash and bloom animation"
```

---

## Task 10: Quest Journal UI

**Files:**
- Create: `src/ui/quest-journal.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create quest journal component**

Create `src/ui/quest-journal.tsx`:

```tsx
import { useState } from "react";
import { useGameStore } from "../store/game-store";
import { quests } from "../game/loader";

export function QuestJournal() {
  const [isOpen, setIsOpen] = useState(false);
  const questStates = useGameStore((s) => s.questStates);

  const visibleQuests = Object.values(quests).filter((q) => {
    const state = questStates[q.id];
    return state && state !== "locked";
  });

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 900,
          background: "#1a1a2e",
          border: "2px solid #FFE066",
          color: "#FFE066",
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "9px",
          padding: "6px 10px",
          cursor: "pointer",
          borderRadius: "2px",
        }}
      >
        {isOpen ? "✕" : "Journal"}
      </button>

      {/* Journal panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 44,
            right: 12,
            zIndex: 900,
            background: "#1a1a2e",
            border: "2px solid #C4A8D8",
            borderRadius: "4px",
            padding: "16px",
            width: "280px",
            maxHeight: "400px",
            overflowY: "auto",
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          <div style={{ color: "#C4A8D8", fontSize: "10px", marginBottom: "12px" }}>
            Quest Journal
          </div>
          {visibleQuests.length === 0 ? (
            <div style={{ color: "#7A7A7A", fontSize: "8px" }}>
              Talk to the villagers to discover quests.
            </div>
          ) : (
            visibleQuests.map((quest) => {
              const state = questStates[quest.id] ?? "locked";
              const stateIcon = state === "completed" ? "✓" : state === "active" ? "●" : "○";
              const stateColor =
                state === "completed" ? "#88D4B0" : state === "active" ? "#FFE066" : "#7A7A7A";
              return (
                <div
                  key={quest.id}
                  style={{
                    marginBottom: "10px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #333",
                  }}
                >
                  <div style={{ color: stateColor, fontSize: "9px" }}>
                    {stateIcon} {quest.title}
                  </div>
                  <div style={{ color: "#aaa", fontSize: "7px", marginTop: "4px", lineHeight: 1.6 }}>
                    {quest.description}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Mount in App**

Add `<QuestJournal />` to `src/App.tsx` after the other overlays.

- [ ] **Step 3: Verify journal shows active/completed quests**

Expected: "Journal" button in top-right. Clicking opens a panel showing any non-locked quests with their status.

- [ ] **Step 4: Commit**

```bash
git add src/ui/quest-journal.tsx src/App.tsx
git commit -m "feat: add quest journal overlay UI"
```

---

## Task 11: Glitch Effects System

**Files:**
- Create: `src/game/systems/glitch.ts`
- Modify: `src/game/scenes/world.ts`

- [ ] **Step 1: Create glitch effects module**

Create `src/game/systems/glitch.ts`:

```typescript
import type { GameObj, KAPLAYCtx } from "kaplay";

export function addGlitchOverlay(k: KAPLAYCtx, x: number, y: number, w: number, h: number): GameObj {
  // Desaturated overlay for glitched zones
  const overlay = k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(k.Color.fromHex("#9B30FF")),
    k.opacity(0.08),
    k.z(15),
    "glitch-overlay",
  ]);

  // Flickering scanline bars
  let scanY = 0;
  const scanline = k.add([
    k.rect(w, 2),
    k.pos(x, y),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0.15),
    k.z(16),
    "glitch-scanline",
  ]);

  scanline.onUpdate(() => {
    scanY += k.dt() * 40;
    if (scanY > h) scanY = 0;
    scanline.pos.y = y + scanY;
  });

  // Random flicker
  let flickerTimer = k.rand(2, 5);
  overlay.onUpdate(() => {
    flickerTimer -= k.dt();
    if (flickerTimer <= 0) {
      overlay.opacity = 0.15;
      k.wait(0.15, () => {
        overlay.opacity = 0.08;
      });
      flickerTimer = k.rand(2, 5);
    }
  });

  return overlay;
}

export function removeGlitchEffects(k: KAPLAYCtx) {
  k.get("glitch-overlay").forEach((obj) => k.destroy(obj));
  k.get("glitch-scanline").forEach((obj) => k.destroy(obj));
}
```

- [ ] **Step 2: Apply glitch effects to the village in world scene**

Add to `src/game/scenes/world.ts`:

```typescript
import { addGlitchOverlay } from "../systems/glitch";

// After spawning NPCs, add glitch zones around glitched NPCs
const store = useGameStore.getState();
for (const npcData of areaNPCs) {
  const state = store.npcStates[npcData.id] ?? npcData.state;
  if (state === "glitched") {
    addGlitchOverlay(k, npcData.position.x - 60, npcData.position.y - 40, 120, 80);
  }
}
```

- [ ] **Step 3: Verify glitch effects appear around NPCs**

Expected: Purple-tinted overlay with cyan scanline moving vertically, occasional flicker, around glitched NPCs.

- [ ] **Step 4: Commit**

```bash
git add src/game/systems/glitch.ts src/game/scenes/world.ts
git commit -m "feat: add glitch visual effects for corrupted zones"
```

---

## Task 12: HUD + Polish + README

**Files:**
- Create: `src/ui/hud.tsx`, `README.md`
- Modify: `src/App.tsx`, `CLAUDE.md`

- [ ] **Step 1: Create minimal HUD**

Create `src/ui/hud.tsx`:

```tsx
import { useGameStore } from "../store/game-store";

export function HUD() {
  const currentArea = useGameStore((s) => s.currentArea);
  const isDialogueOpen = useGameStore((s) => s.isDialogueOpen);

  const areaNames: Record<string, string> = {
    "village-square": "Village Square",
    forge: "The Forge",
    library: "The Library",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 800,
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div style={{ color: "#FFF8E7", fontSize: "9px", opacity: 0.8 }}>
        {areaNames[currentArea] ?? currentArea}
      </div>
      {!isDialogueOpen && (
        <div style={{ color: "#7A7A7A", fontSize: "7px", marginTop: "6px" }}>
          WASD to move · E to interact
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount HUD in App**

Add `<HUD />` to `src/App.tsx`.

- [ ] **Step 3: Update CLAUDE.md for the game project**

Update `CLAUDE.md` to reflect the new standalone game project:

```markdown
# CLAUDE.md

## Project Overview

Claude Code RPG — a Stardew Valley-style 2D pixel art RPG that teaches Claude Code concepts. Players clone this repo, run the game, find bugs by talking to NPCs, and use Claude Code to fix the actual codebase.

## Tech Stack

Vite + React 19 + Kaplay (game engine) + Zustand (state) + Tailwind CSS + TypeScript

## Commands

\`\`\`bash
pnpm dev        # Start dev server on http://localhost:5173
pnpm build      # Production build
pnpm preview    # Preview production build
\`\`\`

## Architecture

- `src/game/` — Kaplay game logic (scenes, entities, systems)
- `src/ui/` — React overlay components (dialogue, journal, HUD)
- `src/store/` — Zustand state management
- `src/data/` — JSON content files (NPCs, quests, areas)
- `public/assets/` — Sprites, tiles, audio, maps

### Key Patterns

- Kaplay handles the game canvas (physics, sprites, movement)
- React renders overlay UI (dialogue box, quest journal, HUD)
- Zustand is the shared state bridge between Kaplay and React
- All game content is JSON-driven — add NPCs/quests by adding JSON files
- Quest checks are registered in `src/game/systems/quest-checks.ts`

## The Intentional Bugs

This game ships with intentional bugs that players fix using Claude Code:

1. **village-charter.json** is empty — Mayor Bramble's quest
2. **crafting.ts** has a commented-out prepare() hook — Harlan's quest

Each bug maps to a Claude Code concept. See quest JSON files for details.

## Content Creation

Use the Claude Code skills in `.claude/skills/` to generate new content:
- `generate-npc` — Create new NPCs
- `generate-quest` — Create new quests
- `brand-and-tone` — Creative guidelines
- `game-architecture` — Technical reference
\`\`\`
```

- [ ] **Step 4: Create README.md**

Create `README.md`:

```markdown
# Claude Code RPG

A cozy, Stardew Valley-style RPG where you learn Claude Code by actually using it.

A developer gets pulled into a broken game world. The village is glitched — NPCs stutter, colors are wrong, things don't work. Your job: use Claude Code to find and fix the bugs in the actual codebase, healing the world one quest at a time.

## Quick Start

\`\`\`bash
git clone <repo-url>
cd claude-code-rpg
pnpm install
pnpm dev
\`\`\`

Open http://localhost:5173 in your browser, then open Claude Code in the same directory.

## How to Play

1. **Explore** the village — walk around with WASD, interact with E
2. **Talk** to NPCs — they'll tell you what's wrong
3. **Open Claude Code** — describe the NPC's problem
4. **Fix the bug** — Claude Code finds and fixes the real code
5. **Return to the NPC** — interact again to trigger the heal moment
6. **Watch the world heal** — colors bloom, music resolves, new areas unlock

## Requirements

- Node.js 18+
- pnpm
- Claude Code (for fixing the bugs)

## Contributing

Want to add quests and NPCs? This repo includes Claude Code skills for content generation:

\`\`\`
claude "Use the generate-npc skill to create a new villager"
claude "Use the generate-quest skill to create a quest for [NPC name]"
\`\`\`

See `.claude/skills/` for the full creative toolkit.
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/hud.tsx src/App.tsx CLAUDE.md README.md
git commit -m "feat: add HUD, update CLAUDE.md and README for standalone game"
```

---

## Dependency Graph

```
Task 1 (Scaffolding)
  └── Task 2 (Kaplay + Store + Types)
        ├── Task 3 (Menu Scene)
        │     └── Task 4 (Transition Scene)
        ├── Task 5 (World Scene + Player)
        │     ├── Task 6 (NPCs + Interaction)
        │     │     ├── Task 7 (Quest System + Checks + Bugs)
        │     │     └── Task 8 (Dialogue Box UI)
        │     └── Task 11 (Glitch Effects)
        ├── Task 9 (Heal Overlay)
        └── Task 10 (Quest Journal)
Task 12 (HUD + README) — depends on all above
```

**Parallelizable groups after Task 2:**
- Group A: Task 3 → Task 4 (menu + transition)
- Group B: Task 5 → Task 6 → Task 7 (world + NPCs + quests)
- Group C: Task 8 (dialogue UI)
- Group D: Task 9 (heal overlay)
- Group E: Task 10 (journal UI)
- Group F: Task 11 (glitch effects)
