import type { KAPLAYCtx } from "kaplay";
import { spawnPlayer } from "../entities/player";
import { spawnNPC } from "../entities/npc";
import { getNPCsForArea } from "../loader";
import { addGlitchOverlay } from "../systems/glitch";
import { tryCompleteQuest } from "../systems/quest";
import { useGameStore } from "../../store/game-store";
import type { NPCData } from "../../store/types";

const TILE = 16;
const COLS = 50;
const ROWS = 38;

const PATH_ROW_START = 17;
const PATH_ROW_END = 19;

// Seeded hash for deterministic pseudo-random per tile
function tileHash(col: number, row: number, seed = 0): number {
  return ((col * 7 + row * 13 + seed * 31) & 0x7fffffff) % 1000;
}

const DIRT_CENTER = "#C8B48A";
const DIRT_EDGE = "#D4C4A0";


function drawTerrain(k: KAPLAYCtx) {
  const worldW = COLS * TILE;
  const worldH = ROWS * TILE;

  // ── Solid grass base (eliminates grid seams entirely) ──
  k.add([
    k.rect(worldW, worldH),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#B8C890")),
    k.z(0),
  ]);

  // ── Large grass texture overlays (8x8 tile blocks, very subtle) ──
  const bigPatch = 8;
  const bigPatchPx = bigPatch * TILE; // 128px game
  const bigPatchScale = bigPatchPx / 256;
  const grassSprites = ["grass-light", "grass-medium"];

  for (let row = 0; row < ROWS; row += bigPatch) {
    for (let col = 0; col < COLS; col += bigPatch) {
      const midRow = row + bigPatch / 2;
      if (midRow >= PATH_ROW_START && midRow <= PATH_ROW_END) continue;

      const h = tileHash(col, row);
      k.add([
        k.sprite(grassSprites[h % grassSprites.length]),
        k.pos(col * TILE, row * TILE),
        k.scale(bigPatchScale),
        k.opacity(0.60),
        k.z(0),
      ]);
    }
  }

  // ── Dirt path (solid color base + sprite overlay) ──
  for (let row = PATH_ROW_START; row <= PATH_ROW_END; row++) {
    const isEdge = row === PATH_ROW_START || row === PATH_ROW_END;
    const color = isEdge ? DIRT_EDGE : DIRT_CENTER;
    k.add([
      k.rect(worldW, TILE),
      k.pos(0, row * TILE),
      k.color(k.Color.fromHex(color)),
      k.z(2),
    ]);
  }

  // Dirt path texture overlays — use large patches and low opacity to blend
  const dirtPatchSize = 10; // tiles per patch
  const dirtPatchPx = dirtPatchSize * TILE;
  const dirtPatchScale = dirtPatchPx / 256;
  for (let col = 0; col < COLS; col += dirtPatchSize) {
    k.add([
      k.sprite("dirt-center"),
      k.pos(col * TILE, PATH_ROW_START * TILE),
      k.scale(dirtPatchScale, (PATH_ROW_END - PATH_ROW_START + 1) * TILE / 256),
      k.opacity(0.45),
      k.z(2),
    ]);
  }

  // ── Pebble details on dirt path ──
  for (let row = PATH_ROW_START; row <= PATH_ROW_END; row++) {
    for (let col = 0; col < COLS; col++) {
      const h = tileHash(col, row, 2);
      if (h % 8 === 0) {
        k.add([
          k.circle(1.5),
          k.pos(col * TILE + (h % 11) + 2, row * TILE + ((h * 3) % 10) + 3),
          k.color(k.Color.fromHex("#B0A080")),
          k.z(2),
        ]);
      }
    }
  }

  // ── Scatter detail sprites on grass (sparse, organic placement) ──
  const detailScale = 0.19; // ~256px → ~49px
  for (let row = 2; row < ROWS - 2; row += 2) {
    const isDirtRow = row >= PATH_ROW_START - 1 && row <= PATH_ROW_END + 1;
    if (isDirtRow) continue;

    for (let col = 2; col < COLS - 2; col += 2) {
      const h = tileHash(col, row, 1);

      // ~8% flower patches
      if (h % 13 === 3) {
        k.add([
          k.sprite("flowers-pink"),
          k.pos(col * TILE + (h % 8), row * TILE + (h % 6)),
          k.anchor("center"),
          k.scale(detailScale),
          k.opacity(0.85),
          k.z(1),
        ]);
      }

      // ~6% tall grass tufts
      if (h % 17 === 7) {
        k.add([
          k.sprite("tall-grass"),
          k.pos(col * TILE + (h % 10), row * TILE + (h % 8)),
          k.anchor("center"),
          k.scale(detailScale * 0.9),
          k.opacity(0.8),
          k.z(1),
        ]);
      }

      // ~3% mushroom clusters
      if (h % 35 === 11) {
        k.add([
          k.sprite("mushrooms"),
          k.pos(col * TILE + (h % 6), row * TILE + (h % 5)),
          k.anchor("center"),
          k.scale(detailScale * 0.85),
          k.opacity(0.9),
          k.z(1),
        ]);
      }
    }
  }
}

function addBuildings(k: KAPLAYCtx) {
  // Front-facing pixel art PNGs: forge 437x636, townhall 415x792, library 407x612
  // Scale ~0.23 to get ~100px wide buildings
  const buildingScale = 0.23;

  // ── FORGE ── (535x844 → ~123x194 at 0.23)
  const forgeX = 50;
  const forgeY = 10;
  const forgeW = 123;
  const forgeH = 194;
  k.add([
    k.sprite("building-forge"),
    k.pos(forgeX, forgeY),
    k.scale(buildingScale),
    k.z(4),
  ]);
  k.add([
    k.rect(forgeW, forgeH * 0.45),
    k.pos(forgeX, forgeY + forgeH * 0.55),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(4),
    "Forge",
  ]);
  k.add([
    k.text("Forge", { size: 8, font: "monospace" }),
    k.pos(forgeX + forgeW / 2, forgeY - 6),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(6),
  ]);

  // ── TOWN HALL ── (415x792 → ~95x182 at 0.23)
  const hallX = 310;
  const hallY = 10;
  const hallW = 95;
  const hallH = 182;
  k.add([
    k.sprite("building-townhall"),
    k.pos(hallX, hallY),
    k.scale(buildingScale),
    k.z(4),
  ]);
  k.add([
    k.rect(hallW, hallH * 0.45),
    k.pos(hallX, hallY + hallH * 0.5),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(4),
    "Town Hall",
  ]);
  k.add([
    k.text("Town Hall", { size: 8, font: "monospace" }),
    k.pos(hallX + hallW / 2, hallY - 6),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(6),
  ]);

  // ── LIBRARY ── (407x612 → ~94x141 at 0.23)
  const libX = 560;
  const libY = 50;
  const libW = 94;
  const libH = 141;
  k.add([
    k.sprite("building-library"),
    k.pos(libX, libY),
    k.scale(buildingScale),
    k.z(4),
  ]);
  k.add([
    k.rect(libW, libH * 0.45),
    k.pos(libX, libY + libH * 0.55),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(4),
    "Library",
  ]);
  k.add([
    k.text("Library", { size: 8, font: "monospace" }),
    k.pos(libX + libW / 2, libY - 6),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(6),
  ]);
}

function addEnvironment(k: KAPLAYCtx) {
  const worldW = COLS * TILE;
  const worldH = ROWS * TILE;

  // Tree scale: ~220px source → ~55px game height
  const treeScale = 0.25;
  const treeSprites = ["oak-tree", "pine-tree", "apple-tree"];

  // Scattered tree clusters
  const treePositions = [
    { x: 40, y: 120 }, { x: 60, y: 140 }, { x: 25, y: 150 },
    { x: 730, y: 110 }, { x: 755, y: 135 }, { x: 710, y: 145 },
    { x: 300, y: 95 }, { x: 330, y: 105 },
    { x: 80, y: 360 }, { x: 100, y: 380 },
    { x: 700, y: 370 }, { x: 680, y: 390 },
  ];

  // Tree line along top boundary
  for (let i = 0; i < 18; i++) {
    const tx = 20 + i * 44 + (i % 3) * 6;
    const ty = 30 + (i % 4) * 8;
    treePositions.push({ x: tx, y: ty });
  }

  // Left boundary trees
  for (let i = 0; i < 8; i++) {
    const tx = 16 + (i % 2) * 12;
    const ty = 80 + i * 55;
    if (ty > (PATH_ROW_START - 2) * TILE && ty < (PATH_ROW_END + 3) * TILE) continue;
    treePositions.push({ x: tx, y: ty });
  }

  // Right boundary trees
  for (let i = 0; i < 8; i++) {
    const tx = worldW - 16 - (i % 2) * 12;
    const ty = 80 + i * 55;
    if (ty > (PATH_ROW_START - 2) * TILE && ty < (PATH_ROW_END + 3) * TILE) continue;
    treePositions.push({ x: tx, y: ty });
  }

  for (let i = 0; i < treePositions.length; i++) {
    const t = treePositions[i];
    const spriteName = treeSprites[i % treeSprites.length];
    k.add([
      k.sprite(spriteName),
      k.pos(t.x - 15, t.y - 28),
      k.anchor("center"),
      k.scale(treeScale),
      k.z(10),
    ]);
  }

  // ── Bushes ──
  const bushScale = 0.28;
  const bushPositions = [
    { x: 120, y: 250 }, { x: 350, y: 150 }, { x: 500, y: 260 },
    { x: 650, y: 260 }, { x: 200, y: 340 }, { x: 550, y: 350 },
  ];
  for (const bp of bushPositions) {
    k.add([
      k.sprite("bush"),
      k.pos(bp.x, bp.y),
      k.anchor("center"),
      k.scale(bushScale),
      k.z(3),
    ]);
  }

  // ── Well in village center ──
  k.add([
    k.sprite("well-wood"),
    k.pos(260, 145),
    k.anchor("center"),
    k.scale(0.50),
    k.z(3),
  ]);

  // ── Decorative props near buildings ──
  k.add([k.sprite("barrel"), k.pos(170, 240), k.anchor("center"), k.scale(0.28), k.z(3)]);
  k.add([k.sprite("crate"), k.pos(270, 230), k.anchor("center"), k.scale(0.28), k.z(3)]);
  k.add([k.sprite("flower-pot"), k.pos(480, 235), k.anchor("center"), k.scale(0.28), k.z(3)]);
  k.add([k.sprite("barrel"), k.pos(580, 240), k.anchor("center"), k.scale(0.28), k.z(3)]);

  // ── Pond ──
  const pondX = 500;
  const pondY = 400;

  // Shoreline — layered for organic shape
  const shoreSprites = [
    { dx: 0, dy: 0, s: 0.55 },
    { dx: -22, dy: 12, s: 0.45 },
    { dx: 18, dy: -10, s: 0.40 },
    { dx: 12, dy: 18, s: 0.38 },
  ];
  for (const sh of shoreSprites) {
    k.add([
      k.sprite("water-edge"),
      k.pos(pondX + sh.dx, pondY + sh.dy),
      k.anchor("center"),
      k.scale(sh.s),
      k.opacity(0.85),
      k.z(1),
    ]);
  }

  // Deep water layers — overlapping for organic shape
  k.add([
    k.sprite("water-deep"),
    k.pos(pondX, pondY),
    k.anchor("center"),
    k.scale(0.55),
    k.opacity(0.9),
    k.z(1),
  ]);
  k.add([
    k.sprite("water-deep"),
    k.pos(pondX - 25, pondY - 5),
    k.anchor("center"),
    k.scale(0.40),
    k.opacity(0.8),
    k.z(1),
  ]);
  k.add([
    k.sprite("water-deep"),
    k.pos(pondX + 25, pondY + 5),
    k.anchor("center"),
    k.scale(0.40),
    k.opacity(0.8),
    k.z(1),
  ]);

  // Shoreline rocks
  k.add([k.sprite("rock-gray"), k.pos(pondX - 55, pondY + 20), k.anchor("center"), k.scale(0.18), k.z(2)]);
  k.add([k.sprite("rock-gray"), k.pos(pondX + 60, pondY - 15), k.anchor("center"), k.scale(0.15), k.z(2)]);
  k.add([k.sprite("rock-gray"), k.pos(pondX + 30, pondY + 50), k.anchor("center"), k.scale(0.20), k.z(2)]);

  // Bank vegetation
  k.add([k.sprite("tall-grass"), k.pos(pondX - 60, pondY - 25), k.anchor("center"), k.scale(0.12), k.z(2)]);
  k.add([k.sprite("tall-grass"), k.pos(pondX + 55, pondY + 35), k.anchor("center"), k.scale(0.10), k.z(2)]);

  // Animated shimmers — 3 at different positions and phases
  const shimmerData = [
    { x: pondX - 15, y: pondY - 10, r: 6, phase: 0 },
    { x: pondX + 20, y: pondY + 5, r: 5, phase: 2.1 },
    { x: pondX - 5, y: pondY + 15, r: 4, phase: 4.2 },
  ];
  for (const sd of shimmerData) {
    const shimmer = k.add([
      k.circle(sd.r),
      k.pos(sd.x, sd.y),
      k.color(k.Color.fromHex("#FFFFFF")),
      k.opacity(0.2),
      k.z(1),
    ]);
    shimmer.onUpdate(() => {
      shimmer.opacity = 0.2 + Math.sin(k.time() * 2 + sd.phase) * 0.15;
    });
  }

  // ── Fences along path edges ──
  const fenceColor = "#8B6839";
  const railColor = "#A07848";
  for (let fx = 100; fx < 760; fx += 34) {
    k.add([k.rect(3, 10), k.pos(fx, PATH_ROW_START * TILE - 10), k.color(k.Color.fromHex(fenceColor)), k.z(3)]);
    k.add([k.rect(3, 10), k.pos(fx, (PATH_ROW_END + 1) * TILE), k.color(k.Color.fromHex(fenceColor)), k.z(3)]);
  }
  k.add([k.rect(660, 2), k.pos(100, PATH_ROW_START * TILE - 7), k.color(k.Color.fromHex(railColor)), k.z(3)]);
  k.add([k.rect(660, 2), k.pos(100, PATH_ROW_START * TILE - 3), k.color(k.Color.fromHex(railColor)), k.z(3)]);
  k.add([k.rect(660, 2), k.pos(100, (PATH_ROW_END + 1) * TILE + 3), k.color(k.Color.fromHex(railColor)), k.z(3)]);
  k.add([k.rect(660, 2), k.pos(100, (PATH_ROW_END + 1) * TILE + 7), k.color(k.Color.fromHex(railColor)), k.z(3)]);

  // Bottom fence
  for (let fx = 20; fx < worldW - 20; fx += 32) {
    k.add([k.rect(3, 10), k.pos(fx, worldH - 18), k.color(k.Color.fromHex(fenceColor)), k.z(3)]);
  }
  k.add([k.rect(worldW - 40, 2), k.pos(20, worldH - 15), k.color(k.Color.fromHex(railColor)), k.z(3)]);
  k.add([k.rect(worldW - 40, 2), k.pos(20, worldH - 11), k.color(k.Color.fromHex(railColor)), k.z(3)]);
}

function addWorldBounds(k: KAPLAYCtx) {
  const worldW = COLS * TILE;
  const worldH = ROWS * TILE;

  k.add([k.rect(8, worldH), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  k.add([k.rect(8, worldH), k.pos(worldW - 8, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  k.add([k.rect(worldW, 8), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  k.add([k.rect(worldW, 8), k.pos(0, worldH - 8), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
}

function addAtmosphere(k: KAPLAYCtx) {
  const worldW = COLS * TILE;
  const worldH = ROWS * TILE;

  // Warm golden-hour overlay
  k.add([
    k.rect(worldW, worldH),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#FFF8D0")),
    k.opacity(0.06),
    k.z(0),
  ]);
}

// Agent NPC data - maps agent files to in-world characters
const AGENT_NPC_CONFIG: Record<string, { name: string; role: string; position: { x: number; y: number }; dialogue: Array<{ speaker: string; text: string }> }> = {
  orchestrator: {
    name: "The Orchestrator",
    role: "Village Leader",
    position: { x: 350, y: 240 },
    dialogue: [
      { speaker: "The Orchestrator", text: "I coordinate the team. When there's a big task, I break it down and assign pieces to each specialist." },
      { speaker: "The Orchestrator", text: "One thing at a time — that's how we avoid chaos. I watch the polish loop: critique, fix, verify, repeat." },
      { speaker: "The Orchestrator", text: "In Claude Code, I'm an agent defined in .claude/agents/. Press K to see all the skills we use!" },
    ],
  },
  critic: {
    name: "The Critic",
    role: "Quality Inspector",
    position: { x: 150, y: 320 },
    dialogue: [
      { speaker: "The Critic", text: "My job is to find every flaw. I test everything — visuals, interactions, rough edges." },
      { speaker: "The Critic", text: "Nothing ships until I say it's polished. Would this embarrass me if I showed it to someone?" },
      { speaker: "The Critic", text: "I'm defined in .claude/agents/critic.md. Each agent has a specific focus and set of tools." },
    ],
  },
  "visual-critic": {
    name: "The Visual Critic",
    role: "Art Inspector",
    position: { x: 600, y: 200 },
    dialogue: [
      { speaker: "The Visual Critic", text: "I judge with my eyes. Every pixel matters. Stardew Valley quality or it goes back to the forge." },
      { speaker: "The Visual Critic", text: "Scale consistency, color cohesion, sprite crispness — these are what I watch for." },
      { speaker: "The Visual Critic", text: "Agents can be specialized for visual work, code review, testing — whatever you need." },
    ],
  },
  implementer: {
    name: "The Implementer",
    role: "Blacksmith",
    position: { x: 90, y: 180 },
    dialogue: [
      { speaker: "The Implementer", text: "Point me at a problem and I'll fix it. Read the issue, read the code, minimal change that solves it." },
      { speaker: "The Implementer", text: "No refactoring for fun. No extra features. Just the fix, clean and targeted." },
      { speaker: "The Implementer", text: "Each agent in .claude/agents/ has rules about what they should and shouldn't do." },
    ],
  },
  "knowledge-keeper": {
    name: "Knowledge Keeper",
    role: "Librarian",
    position: { x: 620, y: 160 },
    dialogue: [
      { speaker: "Knowledge Keeper", text: "I maintain the village records. When someone learns something new, I write it down." },
      { speaker: "Knowledge Keeper", text: "Skills, patterns, lessons — all captured in .claude/skills/ so we never forget." },
      { speaker: "Knowledge Keeper", text: "Press K to open the Skill Bookshelf and see everything we've learned!" },
    ],
  },
};

export function worldScene(k: KAPLAYCtx) {
  const store = useGameStore.getState();
  store.setInWorld(true);
  const { playerPosition, currentArea } = store;

  // --- Terrain & environment ---
  drawTerrain(k);
  addBuildings(k);
  addEnvironment(k);
  addWorldBounds(k);
  addAtmosphere(k);

  // --- Player ---
  const { obj: playerObj, setInteracting } = spawnPlayer(
    k,
    playerPosition.x,
    playerPosition.y,
  );

  // Save position periodically
  k.onUpdate(() => {
    store.savePosition(playerObj.pos.x, playerObj.pos.y);
  });

  // --- NPCs ---
  const areaNPCs = getNPCsForArea(currentArea);
  const npcObjs = areaNPCs.map((npcData) => {
    const liveState = store.npcStates[npcData.id] ?? npcData.state;
    return spawnNPC(k, { ...npcData, state: liveState });
  });

  // --- Glitch overlays ---
  for (let i = 0; i < areaNPCs.length; i++) {
    const npcData = areaNPCs[i];
    const liveState = store.npcStates[npcData.id] ?? npcData.state;
    if (liveState === "glitched") {
      const obj = npcObjs[i];
      addGlitchOverlay(k, obj.pos.x - 60, obj.pos.y - 60, 120, 120);
    }
  }

  // --- Camera (clamped to world bounds) ---
  const worldW = COLS * TILE;
  const worldH = ROWS * TILE;
  const camW = 800;
  const camH = 600;
  k.onUpdate(() => {
    const cx = Math.max(camW / 2, Math.min(worldW - camW / 2, playerObj.pos.x));
    const cy = Math.max(camH / 2, Math.min(worldH - camH / 2, playerObj.pos.y));
    k.setCamPos(cx, cy);
  });

  // --- Unlock player when dialogue closes ---
  useGameStore.subscribe((state, prev) => {
    if (prev.isDialogueOpen && !state.isDialogueOpen) {
      setInteracting(false);
      dialogueCooldown = 0.6;
    }
  });

  // --- NPC Interaction ---
  let dialogueCooldown = 0;
  k.onUpdate(() => {
    if (dialogueCooldown > 0) dialogueCooldown -= k.dt();
  });

  k.onButtonPress("interact", () => {
    const currentStore = useGameStore.getState();

    if (currentStore.isDialogueOpen) {
      currentStore.advanceDialogue();
      return;
    }

    // Prevent immediate re-open after dialogue closes
    if (dialogueCooldown > 0) return;

    const nearbyNPC = npcObjs.find((npc) => (npc as unknown as { isInteractable: boolean }).isInteractable);
    if (!nearbyNPC) return;

    const npcId: string = (nearbyNPC as unknown as { npcId: string }).npcId;
    const npcData = areaNPCs.find((n) => n.id === npcId);
    if (!npcData) return;

    const freshStore = useGameStore.getState();
    const npcState = freshStore.npcStates[npcId] ?? npcData.state;

    setInteracting(true);

    if (npcState === "healed") {
      freshStore.openDialogue(npcData.dialogue.healed);
      return;
    }

    if (npcState === "glitched" && npcData.questId) {
      const questState = freshStore.questStates[npcData.questId] ?? "locked";

      if (questState === "active" || questState === "available") {
        const passed = tryCompleteQuest(npcData.questId);
        if (passed) {
          freshStore.openDialogue(npcData.dialogue.healed);
        } else {
          freshStore.openDialogue([
            { speaker: npcData.name, text: "Something still feels... off. Like a variable that never got set." },
            ...npcData.dialogue.questGiving,
          ]);
        }
        return;
      }

      freshStore.setQuestState(npcData.questId, "active");
      freshStore.openDialogue(npcData.dialogue.glitched);
      return;
    }

    freshStore.openDialogue(npcData.dialogue.glitched);
  });

  // --- Bookshelf toggle (K key) ---
  k.onButtonPress("bookshelf", () => {
    const s = useGameStore.getState();
    if (s.isDialogueOpen || s.isHealing) return;
    if (s.isBookshelfOpen) {
      s.closeBookshelf();
    } else {
      s.openBookshelf();
    }
  });

  // Disable player movement when bookshelf/editor is open
  useGameStore.subscribe((state, prev) => {
    if (state.isBookshelfOpen && !prev.isBookshelfOpen) {
      setInteracting(true);
    }
    if (!state.isBookshelfOpen && prev.isBookshelfOpen) {
      setInteracting(false);
    }
  });

  // --- Agent NPCs (from .claude/agents/) ---
  // Fetch agents data then spawn them
  store.fetchAgents().then(() => {
    const agentData = useGameStore.getState().agents;
    for (const agent of agentData) {
      const filename = agent.path.split("/").pop()?.replace(".md", "") || "";
      const config = AGENT_NPC_CONFIG[filename];
      if (!config) continue;

      const agentNPCData: NPCData = {
        id: `agent-${filename}`,
        name: config.name,
        role: config.role,
        area: currentArea,
        position: config.position,
        state: "healed",
        catchphrase: agent.description.slice(0, 60),
        personality: {
          trait: config.role,
          speechPattern: "professional",
          quirk: "always focused",
        },
        dialogue: {
          glitched: config.dialogue,
          questGiving: config.dialogue,
          healed: config.dialogue,
        },
        sprite: {
          idle: "npc-mayor",
          glitched: "npc-mayor",
          healed: "npc-mayor-alt",
        },
        questId: null,
        _creatorNote: `Agent NPC: ${filename}`,
      };

      const agentNpcObj = spawnNPC(k, agentNPCData);

      // Add agent NPC to interaction handling
      npcObjs.push(agentNpcObj);
      areaNPCs.push(agentNPCData);
    }
  });

  // Fetch skills data for the bookshelf
  store.fetchSkills();
}
