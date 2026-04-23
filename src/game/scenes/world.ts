import type { KAPLAYCtx } from "kaplay";
import { spawnPlayer } from "../entities/player";
import { spawnNPC } from "../entities/npc";
import { getNPCsForArea } from "../loader";
import { initBuildingSpawner } from "../systems/building-spawner";
import { startQuestWatcher } from "../systems/quest";
import { useGameStore } from "../../store/game-store";

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

  // ── Scatter detail sprites on grass (organic, natural placement) ──
  const pathTop = (PATH_ROW_START - 1) * TILE;
  const pathBot = (PATH_ROW_END + 2) * TILE;

  function isOnGrass(x: number, y: number): boolean {
    if (x < TILE * 2 || x > worldW - TILE * 2) return false;
    if (y < TILE * 2 || y > worldH - TILE * 2) return false;
    if (y > pathTop && y < pathBot) return false;
    return true;
  }

  // Seeded random using the tile hash for determinism
  function scatterPositions(count: number, seed: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < count * 3; i++) {
      const h1 = tileHash(i, seed, 42);
      const h2 = tileHash(seed, i, 99);
      const x = (h1 / 1000) * worldW;
      const y = (h2 / 1000) * worldH;
      if (isOnGrass(x, y)) {
        positions.push({ x, y });
        if (positions.length >= count) break;
      }
    }
    return positions;
  }

  // Flowers — small, scattered clusters
  for (const pos of scatterPositions(18, 1)) {
    const h = tileHash(Math.floor(pos.x), Math.floor(pos.y), 3);
    const scale = 0.06 + (h % 5) * 0.01; // 0.06-0.10 (15-26px, roughly 1-2 tiles)
    k.add([
      k.sprite("flowers-pink"),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.scale(scale),
      k.opacity(0.8 + (h % 3) * 0.05),
      k.z(1),
    ]);
  }

  // Tall grass tufts — slightly more common
  for (const pos of scatterPositions(14, 2)) {
    const h = tileHash(Math.floor(pos.x), Math.floor(pos.y), 7);
    const scale = 0.05 + (h % 4) * 0.01; // 0.05-0.08
    k.add([
      k.sprite("tall-grass"),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.scale(scale),
      k.opacity(0.7 + (h % 4) * 0.05),
      k.z(1),
    ]);
  }

  // Mushroom clusters — rare, small
  for (const pos of scatterPositions(6, 3)) {
    const h = tileHash(Math.floor(pos.x), Math.floor(pos.y), 11);
    const scale = 0.05 + (h % 3) * 0.008; // 0.05-0.066
    k.add([
      k.sprite("mushrooms"),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.scale(scale),
      k.opacity(0.85),
      k.z(1),
    ]);
  }
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

export function worldScene(k: KAPLAYCtx) {
  const store = useGameStore.getState();
  store.setInWorld(true);
  store.startGame();
  const { playerPosition, currentArea } = store;

  // --- Terrain & environment ---
  drawTerrain(k);
  addEnvironment(k);
  addWorldBounds(k);
  addAtmosphere(k);

  // --- Dynamic buildings (driven by file watcher) ---
  initBuildingSpawner(k);

  // --- Fetch initial world state & start quest watcher ---
  store.fetchWorldState();
  startQuestWatcher();

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

  k.onButtonPress("interact", async () => {
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

    setInteracting(true);

    // Refresh world state before selecting dialogue
    await useGameStore.getState().fetchWorldState();
    const freshStore = useGameStore.getState();
    const { worldState } = freshStore;

    // World-state-aware dialogue selection
    const townHallExists = worldState.buildings["town-hall"]?.exists ?? false;

    if (townHallExists) {
      // Town hall is built — show fulfilled dialogue
      freshStore.openDialogue(npcData.dialogue.fulfilled);
    } else {
      // No town hall — check if player has talked before
      const questState = npcData.questId
        ? freshStore.questStates[npcData.questId] ?? "locked"
        : "locked";

      if (questState === "active") {
        // Already talked, give reminder
        freshStore.openDialogue(npcData.dialogue.reminder);
      } else {
        // First encounter — set quest active and give intro dialogue
        if (npcData.questId) {
          freshStore.setQuestState(npcData.questId, "active");
        }
        freshStore.openDialogue(npcData.dialogue.intro);
      }
    }
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

  // Fetch skills data for the bookshelf
  store.fetchSkills();
}
