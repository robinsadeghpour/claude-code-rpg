import type { KAPLAYCtx, GameObj } from "kaplay";
import { onFileEvent, connectFileWatcher, disconnectFileWatcher } from "./file-watcher";

interface BuildingRegistryEntry {
  position: [number, number];
  spriteKey: string;
  assetFile: string;
  scale: number;
  label: string;
  interactable: boolean;
  unlocks: string[];
  exists: boolean;
}

type BuildingRegistry = Record<string, BuildingRegistryEntry>;

// Track spawned building objects so we can remove them
const spawnedBuildings = new Map<string, GameObj[]>();

function spawnBuilding(k: KAPLAYCtx, id: string, entry: BuildingRegistryEntry, animate: boolean) {
  if (spawnedBuildings.has(id)) return; // already spawned

  const [x, y] = entry.position;
  const scale = entry.scale;

  // Approximate building dimensions at scale (based on existing building sizes)
  const approxW = 100;
  const approxH = 180;

  const objects: GameObj[] = [];

  // Sprite
  const spriteObj = k.add([
    k.sprite(entry.spriteKey),
    k.pos(x, y),
    k.scale(animate ? 0 : scale),
    k.opacity(animate ? 0 : 1),
    k.z(4),
  ]);
  objects.push(spriteObj);

  // Collision body (lower half)
  const collisionObj = k.add([
    k.rect(approxW, approxH * 0.45),
    k.pos(x, y + approxH * 0.55),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(4),
    id,
  ]);
  objects.push(collisionObj);

  // Label
  const labelObj = k.add([
    k.text(entry.label, { size: 8, font: "monospace" }),
    k.pos(x + approxW / 2, y - 6),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.opacity(animate ? 0 : 1),
    k.z(6),
  ]);
  objects.push(labelObj);

  spawnedBuildings.set(id, objects);

  // Spawn animation
  if (animate) {
    const duration = 0.6;
    let elapsed = 0;

    spriteObj.onUpdate(() => {
      elapsed += k.dt();
      const t = Math.min(elapsed / duration, 1);
      // Bounce easing: overshoot then settle
      const bounce = t < 0.6
        ? (t / 0.6) * 1.15
        : 1.15 - (t - 0.6) / 0.4 * 0.15;
      const s = Math.min(bounce, 1.15) * scale;

      spriteObj.scale = k.vec2(s, s);
      spriteObj.opacity = Math.min(t * 2, 1);
      labelObj.opacity = Math.min(t * 2, 1);
    });

    // Dust particles
    for (let i = 0; i < 6; i++) {
      const px = x + approxW / 2 + (Math.random() - 0.5) * approxW;
      const py = y + approxH - 10 + Math.random() * 10;
      const dust = k.add([
        k.circle(2),
        k.pos(px, py),
        k.color(k.Color.fromHex("#D4C4A0")),
        k.opacity(0.7),
        k.z(5),
      ]);
      const vx = (Math.random() - 0.5) * 40;
      const vy = -Math.random() * 30 - 10;
      dust.onUpdate(() => {
        dust.pos.x += vx * k.dt();
        dust.pos.y += vy * k.dt();
        dust.opacity -= k.dt() * 1.2;
        if (dust.opacity <= 0) dust.destroy();
      });
    }
  }
}

function removeBuilding(id: string) {
  const objects = spawnedBuildings.get(id);
  if (!objects) return;
  for (const obj of objects) {
    obj.destroy();
  }
  spawnedBuildings.delete(id);
}

export async function initBuildingSpawner(k: KAPLAYCtx) {
  // Fetch current building state
  let registry: BuildingRegistry;
  try {
    const res = await fetch("/api/buildings");
    registry = await res.json();
  } catch {
    console.warn("[building-spawner] Could not fetch building registry");
    return;
  }

  // Spawn buildings that already exist (no animation)
  for (const [id, entry] of Object.entries(registry)) {
    if (entry.exists) {
      // Ensure sprite is loaded (might be a dynamically generated asset)
      try {
        k.getSprite(entry.spriteKey);
      } catch {
        // Try loading from game-assets
        try {
          await k.loadSprite(entry.spriteKey, `/game-assets/buildings/${entry.assetFile}`);
        } catch {
          console.warn(`[building-spawner] Could not load sprite for ${id}`);
          continue;
        }
      }
      spawnBuilding(k, id, entry, false);
    }
  }

  // Subscribe to file watcher for new buildings
  const unsubscribe = onFileEvent(async (event) => {
    if (event.category !== "building") return;

    // Re-fetch registry to get updated state
    try {
      const res = await fetch("/api/buildings");
      const updatedRegistry: BuildingRegistry = await res.json();

      for (const [id, entry] of Object.entries(updatedRegistry)) {
        if (event.type === "created" && entry.exists && !spawnedBuildings.has(id)) {
          // Load sprite dynamically if needed
          try {
            k.getSprite(entry.spriteKey);
          } catch {
            try {
              await k.loadSprite(entry.spriteKey, `/game-assets/buildings/${entry.assetFile}`);
            } catch {
              // Try with the static assets path as fallback
              try {
                await k.loadSprite(entry.spriteKey, `/assets/sprites/${entry.assetFile}`);
              } catch {
                console.warn(`[building-spawner] Could not load sprite for ${id}`);
                continue;
              }
            }
          }
          spawnBuilding(k, id, entry, true);
        }

        if (event.type === "deleted" && !entry.exists && spawnedBuildings.has(id)) {
          removeBuilding(id);
        }
      }
    } catch {
      console.warn("[building-spawner] Could not refresh building registry");
    }
  });

  // Connect the file watcher
  connectFileWatcher();

  // Cleanup on scene end
  k.onSceneLeave(() => {
    unsubscribe();
    disconnectFileWatcher();
    spawnedBuildings.clear();
  });
}
