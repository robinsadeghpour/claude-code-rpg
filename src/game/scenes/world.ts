import type { KAPLAYCtx } from "kaplay";
import { spawnPlayer } from "../entities/player";
import { spawnNPC } from "../entities/npc";
import { getNPCsForArea } from "../loader";
import { addGlitchOverlay } from "../systems/glitch";
import { tryCompleteQuest } from "../systems/quest";
import { useGameStore } from "../../store/game-store";

const TILE = 16;
const COLS = 50;
const ROWS = 38;

const GRASS_A = "#C5D5A5";
const GRASS_B = "#B8CA98";
const DIRT = "#D4C4A0";

// Tile rows where the dirt path runs (pixel y = row * TILE)
const PATH_ROW_START = 17;
const PATH_ROW_END = 19;

function drawTerrain(k: KAPLAYCtx) {
  // Grass grid
  for (let row = 0; row < ROWS; row++) {
    const isDirtRow = row >= PATH_ROW_START && row <= PATH_ROW_END;
    for (let col = 0; col < COLS; col++) {
      const color = isDirtRow
        ? DIRT
        : (row + col) % 2 === 0
          ? GRASS_A
          : GRASS_B;
      k.add([
        k.rect(TILE, TILE),
        k.pos(col * TILE, row * TILE),
        k.color(k.Color.fromHex(color)),
        k.z(isDirtRow ? 1 : 0),
      ]);
    }
  }
}

function addBuildings(k: KAPLAYCtx) {
  const buildings = [
    { label: "Forge", x: 160, y: 200, w: 64, h: 48, color: "#8B6549" },
    { label: "Town Hall", x: 400, y: 180, w: 80, h: 56, color: "#9B7555" },
    { label: "Library", x: 600, y: 200, w: 56, h: 48, color: "#7A6545" },
  ];

  for (const b of buildings) {
    k.add([
      k.rect(b.w, b.h),
      k.pos(b.x, b.y),
      k.color(k.Color.fromHex(b.color)),
      k.area(),
      k.body({ isStatic: true }),
      k.z(2),
      b.label,
    ]);

    // Building label
    k.add([
      k.text(b.label, { size: 7, font: "monospace" }),
      k.pos(b.x + b.w / 2, b.y - 8),
      k.anchor("center"),
      k.color(k.Color.fromHex("#FFF8E7")),
      k.z(3),
    ]);
  }
}

function addWorldBounds(k: KAPLAYCtx) {
  const worldW = COLS * TILE; // 800
  const worldH = ROWS * TILE; // 608

  // Left wall
  k.add([k.rect(8, worldH), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  // Right wall
  k.add([k.rect(8, worldH), k.pos(worldW - 8, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  // Top wall
  k.add([k.rect(worldW, 8), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
  // Bottom wall
  k.add([k.rect(worldW, 8), k.pos(0, worldH - 8), k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(0)]);
}

function addDialogueUI(k: KAPLAYCtx) {
  const BOX_X = 40;
  const BOX_Y = 480;
  const BOX_W = 720;
  const BOX_H = 96;

  const box = k.add([
    k.rect(BOX_W, BOX_H),
    k.pos(BOX_X, BOX_Y),
    k.color(k.Color.fromHex("#1A1A2E")),
    k.opacity(0),
    k.z(20),
    k.fixed(),
  ]);

  const speakerLabel = k.add([
    k.text("", { size: 10, font: "monospace" }),
    k.pos(BOX_X + 12, BOX_Y + 10),
    k.color(k.Color.fromHex("#FFE066")),
    k.opacity(0),
    k.z(21),
    k.fixed(),
  ]);

  const lineLabel = k.add([
    k.text("", { size: 9, font: "monospace", width: BOX_W - 24 }),
    k.pos(BOX_X + 12, BOX_Y + 26),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.opacity(0),
    k.z(21),
    k.fixed(),
  ]);

  const advanceHint = k.add([
    k.text("[E] continue", { size: 8, font: "monospace" }),
    k.pos(BOX_X + BOX_W - 12, BOX_Y + BOX_H - 12),
    k.anchor("botright"),
    k.color(k.Color.fromHex("#888888")),
    k.opacity(0),
    k.z(21),
    k.fixed(),
  ]);

  function syncUI() {
    const state = useGameStore.getState();
    const open = state.isDialogueOpen;
    const line = open && state.currentDialogue
      ? state.currentDialogue[state.dialogueIndex]
      : null;

    box.opacity = open ? 0.92 : 0;
    speakerLabel.opacity = open ? 1 : 0;
    lineLabel.opacity = open ? 1 : 0;
    advanceHint.opacity = open ? 1 : 0;

    if (line) {
      speakerLabel.text = line.speaker;
      lineLabel.text = line.text;
    }
  }

  // Sync every frame (lightweight — just reads from store)
  k.onUpdate(syncUI);
}

export function worldScene(k: KAPLAYCtx) {
  const store = useGameStore.getState();
  const { playerPosition, currentArea } = store;

  // --- Terrain & environment ---
  drawTerrain(k);
  addBuildings(k);
  addWorldBounds(k);

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
    // Use live NPC state from store if available
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

  // --- Camera ---
  k.onUpdate(() => {
    k.setCamPos(playerObj.pos.x, playerObj.pos.y);
  });

  // --- Dialogue UI ---
  addDialogueUI(k);

  // --- Unlock player when dialogue closes ---
  useGameStore.subscribe((state, prev) => {
    if (prev.isDialogueOpen && !state.isDialogueOpen) {
      setInteracting(false);
    }
  });

  // --- NPC Interaction ---
  k.onButtonPress("interact", () => {
    const currentStore = useGameStore.getState();

    // If dialogue is open, advance it
    if (currentStore.isDialogueOpen) {
      currentStore.advanceDialogue();
      return;
    }

    // Find an interactable NPC the player is overlapping
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

      // First encounter — start quest
      freshStore.setQuestState(npcData.questId, "active");
      freshStore.openDialogue(npcData.dialogue.glitched);
      return;
    }

    // Fallback: show glitched dialogue
    freshStore.openDialogue(npcData.dialogue.glitched);
  });
}
