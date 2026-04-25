import fs from "node:fs";
import path from "node:path";
import type { ViteDevServer } from "vite";
import type { ServerResponse } from "node:http";

const GAME_ASSETS_DIR = path.resolve(process.cwd(), "game-assets");
const GAME_DATA_DIR = path.resolve(process.cwd(), "game-data");
const BUILDINGS_REGISTRY = path.join(GAME_DATA_DIR, "buildings.json");
const WORLD_STATE_FILE = path.join(GAME_DATA_DIR, "world-state.json");
const PLACEMENT_INTENT_FILE = path.join(GAME_DATA_DIR, "placement-intent.json");

interface FileEvent {
  type: "created" | "deleted";
  category: "building" | "character" | "tile";
  filename: string;
}

interface BuildingEntry {
  position: [number, number];
  spriteKey: string;
  assetFile: string;
  scale: number;
  label: string;
  interactable: boolean;
  unlocks: string[];
}

interface WorldState {
  buildings: Record<string, { exists: boolean; builtAt: string | null }>;
  questProgress: Record<string, string>;
  lastEvent: string | null;
}

// SSE clients
const sseClients = new Set<ServerResponse>();

function sendSSE(event: FileEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function readRegistry(): Record<string, BuildingEntry> {
  if (!fs.existsSync(BUILDINGS_REGISTRY)) return {};
  return JSON.parse(fs.readFileSync(BUILDINGS_REGISTRY, "utf-8"));
}

function readWorldState(): WorldState {
  if (!fs.existsSync(WORLD_STATE_FILE)) {
    return { buildings: {}, questProgress: {}, lastEvent: null };
  }
  return JSON.parse(fs.readFileSync(WORLD_STATE_FILE, "utf-8"));
}

function writeWorldState(state: WorldState) {
  fs.writeFileSync(WORLD_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function syncWorldState() {
  const registry = readRegistry();
  const state = readWorldState();
  const buildingsDir = path.join(GAME_ASSETS_DIR, "buildings");

  for (const [id, entry] of Object.entries(registry)) {
    const assetPath = path.join(buildingsDir, entry.assetFile);
    const exists = fs.existsSync(assetPath);
    const prev = state.buildings[id];

    if (exists && !prev?.exists) {
      state.buildings[id] = { exists: true, builtAt: new Date().toISOString() };
      state.lastEvent = `${id}-built`;
      sendSSE({ type: "created", category: "building", filename: entry.assetFile });
    } else if (!exists && prev?.exists) {
      state.buildings[id] = { exists: false, builtAt: null };
      state.lastEvent = `${id}-removed`;
      sendSSE({ type: "deleted", category: "building", filename: entry.assetFile });
    } else if (exists) {
      // Already tracked, ensure it's set
      if (!state.buildings[id]) {
        state.buildings[id] = { exists: true, builtAt: new Date().toISOString() };
      }
    } else {
      if (!state.buildings[id]) {
        state.buildings[id] = { exists: false, builtAt: null };
      }
    }
  }

  writeWorldState(state);
  return state;
}

// Debounce watcher events
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncWorldState();
  }, 300);
}

function startWatcher() {
  // Ensure directories exist
  const buildingsDir = path.join(GAME_ASSETS_DIR, "buildings");
  if (!fs.existsSync(buildingsDir)) {
    fs.mkdirSync(buildingsDir, { recursive: true });
  }
  if (!fs.existsSync(GAME_DATA_DIR)) {
    fs.mkdirSync(GAME_DATA_DIR, { recursive: true });
  }

  // Initial sync
  syncWorldState();

  // Watch the buildings asset dir (PNG files arrive here)
  try {
    fs.watch(buildingsDir, { recursive: false }, scheduleSync);
  } catch (err) {
    console.warn("[file-watcher] Could not watch buildings dir:", err);
  }

  // Watch game-data dir too — buildings.json may be written after the PNG,
  // so the asset-only watcher can race past an in-flight registry update.
  try {
    fs.watch(GAME_DATA_DIR, { recursive: false }, (_evt, filename) => {
      if (filename === "buildings.json") scheduleSync();
    });
  } catch (err) {
    console.warn("[file-watcher] Could not watch game-data dir:", err);
  }
}

export function fileWatcherPlugin() {
  return {
    name: "file-watcher",
    configureServer(server: ViteDevServer) {
      startWatcher();

      server.middlewares.use((req, res, next) => {
        // SSE endpoint
        if (req.url === "/api/watch" && req.method === "GET") {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          });
          res.write("data: {\"type\":\"connected\"}\n\n");
          sseClients.add(res);
          req.on("close", () => sseClients.delete(res));
          return;
        }

        // Buildings API (registry + existence check)
        if (req.url === "/api/buildings" && req.method === "GET") {
          const registry = readRegistry();
          const state = readWorldState();
          const result: Record<string, BuildingEntry & { exists: boolean }> = {};

          for (const [id, entry] of Object.entries(registry)) {
            result[id] = {
              ...entry,
              exists: state.buildings[id]?.exists ?? false,
            };
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
          return;
        }

        // World state API
        if (req.url === "/api/world-state" && req.method === "GET") {
          const state = syncWorldState();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(state));
          return;
        }

        // Reset world — wipes all built sprites + per-session player buildings,
        // resets world-state. Used by "Begin New Journey".
        if (req.url === "/api/reset-world" && req.method === "POST") {
          try {
            const buildingsDir = path.join(GAME_ASSETS_DIR, "buildings");
            const registry = readRegistry();
            // Track core (project-defined) building IDs vs player-built ones.
            const coreIds = new Set(["town-hall", "forge", "library"]);
            // Delete the rendered PNG for every registered building.
            for (const entry of Object.values(registry)) {
              const filePath = path.join(buildingsDir, entry.assetFile);
              if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch { /* ignore */ }
              }
            }
            // Drop player-built entries from the registry; keep core entries
            // so the town-hall quest still has a target.
            const trimmedRegistry: Record<string, BuildingEntry> = {};
            for (const [id, entry] of Object.entries(registry)) {
              if (coreIds.has(id)) trimmedRegistry[id] = entry;
            }
            fs.writeFileSync(
              BUILDINGS_REGISTRY,
              JSON.stringify(trimmedRegistry, null, 2),
              "utf-8",
            );
            // Reset world-state.json to all-empty.
            const blank: WorldState = { buildings: {}, questProgress: {}, lastEvent: null };
            writeWorldState(blank);
            // Also remove placement-intent.json if present.
            if (fs.existsSync(PLACEMENT_INTENT_FILE)) {
              try { fs.unlinkSync(PLACEMENT_INTENT_FILE); } catch { /* ignore */ }
            }
            // Run the watcher's sync to push delete SSE events to any listeners.
            syncWorldState();
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // Placement intent — written by the game when the player presses F + PLACE.
        // Read by the player-authored Claude Code skill to know where to drop the asset.
        if (req.url === "/api/placement-intent" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              if (
                typeof parsed.skillName !== "string" ||
                typeof parsed.kind !== "string" ||
                typeof parsed.buildingId !== "string" ||
                !Array.isArray(parsed.position) ||
                parsed.position.length !== 2
              ) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "invalid intent shape" }));
                return;
              }
              if (!fs.existsSync(GAME_DATA_DIR)) {
                fs.mkdirSync(GAME_DATA_DIR, { recursive: true });
              }
              const intent = {
                skillName: parsed.skillName,
                kind: parsed.kind,
                position: [Number(parsed.position[0]), Number(parsed.position[1])],
                buildingId: parsed.buildingId,
                writtenAt: new Date().toISOString(),
              };
              fs.writeFileSync(PLACEMENT_INTENT_FILE, JSON.stringify(intent, null, 2), "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true, path: "game-data/placement-intent.json" }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        next();
      });

      // Serve game-assets as static files
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/game-assets/")) return next();

        const filePath = path.join(
          GAME_ASSETS_DIR,
          req.url.replace("/game-assets/", "")
        );

        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".webp": "image/webp",
          ".json": "application/json",
        };

        res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}
