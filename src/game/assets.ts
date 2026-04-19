import type { KAPLAYCtx } from "kaplay";

/**
 * Load all game sprite assets. Must be called before any scene that uses sprites.
 */
export function loadAssets(k: KAPLAYCtx) {
  // ── Terrain tiles (256x256 each, used as tiling textures) ──
  k.loadSprite("grass-light", "/assets/tiles/grass-light.png");
  k.loadSprite("grass-medium", "/assets/tiles/grass-medium.png");
  k.loadSprite("grass-dark", "/assets/tiles/grass-dark.png");
  k.loadSprite("grass-flowers", "/assets/tiles/grass-flowers.png");
  k.loadSprite("dirt-center", "/assets/tiles/dirt-center.png");
  k.loadSprite("dirt-edge", "/assets/tiles/dirt-edge-grass.png");
  k.loadSprite("dirt-path", "/assets/tiles/dirt-path.png");
  k.loadSprite("flowers-pink", "/assets/tiles/flowers-pink.png");
  k.loadSprite("tall-grass", "/assets/tiles/tall-grass.png");
  k.loadSprite("mushrooms", "/assets/tiles/mushrooms.png");
  k.loadSprite("water-deep", "/assets/tiles/water-deep.png");
  k.loadSprite("water-edge", "/assets/tiles/water-edge.png");
  k.loadSprite("sand", "/assets/tiles/sand.png");

  // ── Player sprite sheet (4 cols x 4 rows: down, up, left, right) ──
  k.loadSprite("player-sprite", "/assets/sprites/player.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
      "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
      "walk-up": { from: 4, to: 7, loop: true, speed: 8 },
      "walk-left": { from: 12, to: 15, loop: true, speed: 8 },
      "walk-right": { from: 8, to: 11, loop: true, speed: 8 },
      "idle-down": 0,
      "idle-up": 4,
      "idle-left": 12,
      "idle-right": 8,
    },
  });

  // ── NPC sprites ──
  k.loadSprite("npc-mayor", "/assets/sprites/npc-mayor.png");
  k.loadSprite("npc-mayor-alt", "/assets/sprites/npc-mayor-alt.png");
  k.loadSprite("npc-blacksmith", "/assets/sprites/npc-blacksmith.png");
  k.loadSprite("npc-blacksmith-alt", "/assets/sprites/npc-blacksmith-alt.png");

  // ── Buildings (front-facing pixel art) ──
  k.loadSprite("building-forge", "/assets/sprites/building-forge.png");
  k.loadSprite("building-townhall", "/assets/sprites/building-townhall.png");
  k.loadSprite("building-library", "/assets/sprites/building-library.png");

  // ── Menu background ──
  k.loadSprite("menu-background", "/assets/sprites/menu-background.png");

  // ── Props (individual sprites) ──
  k.loadSprite("oak-tree", "/assets/sprites/props/oak-tree.png");
  k.loadSprite("pine-tree", "/assets/sprites/props/pine-tree.png");
  k.loadSprite("apple-tree", "/assets/sprites/props/apple-tree.png");
  k.loadSprite("dead-tree", "/assets/sprites/props/dead-tree.png");
  k.loadSprite("bush", "/assets/sprites/props/bush.png");
  k.loadSprite("rock-gray", "/assets/sprites/props/rock-gray.png");
  k.loadSprite("well-wood", "/assets/sprites/props/well-wood.png");
  k.loadSprite("barrel", "/assets/sprites/props/barrel.png");
  k.loadSprite("flower-pot", "/assets/sprites/props/flower-pot.png");
  k.loadSprite("crate", "/assets/sprites/props/crate.png");
}
