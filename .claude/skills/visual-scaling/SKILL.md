---
name: visual-scaling
description: "Validated sprite scale reference table for Claude Code RPG (800x600 canvas). Use this skill whenever setting k.scale(), opacity, or any visual sizing value for game objects — sprites, props, terrain overlays, or NPCs. Prevents the #1 visual polish failure: sprites being too small or too transparent to read."
---

# Visual Scaling Reference — Claude Code RPG

## The Problem

The source art is high quality. Visual failures are almost always a **scale and visibility problem**, not an art problem.

At 256px source size, a scale below `0.15` causes pixel art detail to collapse into a colored blob. Below `0.10`, the sprite is effectively invisible at normal play distance.

## Validated Scale Table

Tested on 800×600 canvas. "Bad" = original values that shipped; "Good" = validated values after visual polish audit.

| Element | Source Size | Bad Scale | Good Scale | Render Size |
|---|---|---|---|---|
| NPC sprites | ~440px | 0.08 | **0.13** | ~57px |
| Player sprite | ~212px | 0.16 | **0.21** | ~45px |
| Buildings | ~341×1024px | 0.25 | **0.25** ✓ | ~85×256px |
| Trees | ~220px | 0.25 | **0.25** ✓ | ~55px |
| Bushes | ~256px | 0.20 | **0.28** | ~72px |
| Barrels / crates | ~256px | 0.12 | **0.22** | ~56px |
| Well | ~256px | 0.18 | **0.28** | ~72px |
| Grass scatter details | ~256px | 0.07 | **0.19** | ~49px |
| Water pond | ~256px | 0.18 | **0.55** | ~141px |

### Opacity Values

| Element | Bad Opacity | Good Opacity |
|---|---|---|
| Grass overlay | 0.35 | **0.60** |
| Dirt texture | 0.30 | **0.45** |

## Rules of Thumb

For 256px source sprites on an 800×600 canvas:

| Use case | Minimum scale |
|---|---|
| Small props (barrels, rocks) | **0.15** |
| Player-readable objects | **0.20** |
| Prominent features (buildings, trees) | **0.25** |
| Large terrain features (pond) | **0.50+** |

For non-256px sources, scale proportionally:
- 440px source NPC → validated at `0.13` (57px render)
- 212px source player → validated at `0.21` (45px render)
- Target render size: **40–75px for characters and props**, **55–85px for buildings and trees**

## Kaplay Code Pattern

```typescript
// NPC — 440px source
k.add([
  k.sprite("npc-sprite"),
  k.pos(x, y),
  k.anchor("center"),
  k.scale(0.13),   // 440 * 0.13 ≈ 57px ✓
  k.z(5),
]);

// Player — 212px source
k.add([
  k.sprite("player-sprite"),
  k.pos(x, y),
  k.anchor("center"),
  k.scale(0.21),   // 212 * 0.21 ≈ 45px ✓
  k.area({ scale: 0.5 }),
  k.body(),
  k.z(5),
]);

// Prop (barrel/well) — 256px source
k.add([
  k.sprite("barrel"),
  k.pos(x, y),
  k.anchor("center"),
  k.scale(0.22),   // 256 * 0.22 ≈ 56px ✓
  k.z(3),
]);

// Terrain overlay (opacity)
k.add([
  k.sprite("grass-overlay"),
  k.pos(x, y),
  k.opacity(0.60),   // not 0.35 ✓
  k.z(1),
]);
```

## Checklist When Adding a New Sprite

- [ ] Source sprite size known (check the PNG dimensions)
- [ ] Calculated render size: `source * scale` is at least 40px for characters, 35px for small props
- [ ] Scale is ≥ 0.15 for any 256px sprite
- [ ] Opacity overlays are ≥ 0.45 (terrain), ≥ 0.60 (primary elements)
- [ ] Visually verified in-game at 800×600 — can the player identify what the sprite is at a glance?
