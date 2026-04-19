import fs from "node:fs";
import path from "node:path";
import type { ViteDevServer } from "vite";
import type { ServerResponse } from "node:http";

const GAME_ASSETS_DIR = path.resolve(process.cwd(), "game-assets");
const GAME_DATA_DIR = path.resolve(process.cwd(), "game-data");
const BUILDINGS_REGISTRY = path.join(GAME_DATA_DIR, "buildings.json");
const WORLD_STATE_FILE = path.join(GAME_DATA_DIR, "world-state.json");

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

function startWatcher() {
  // Ensure directories exist
  const buildingsDir = path.join(GAME_ASSETS_DIR, "buildings");
  if (!fs.existsSync(buildingsDir)) {
    fs.mkdirSync(buildingsDir, { recursive: true });
  }

  // Initial sync
  syncWorldState();

  // Watch for changes
  try {
    fs.watch(buildingsDir, { recursive: false }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        syncWorldState();
      }, 300);
    });
  } catch (err) {
    console.warn("[file-watcher] Could not start watcher:", err);
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
