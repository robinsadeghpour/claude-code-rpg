---
name: cozy-cottage
description: Use this skill when the user asks to place or build a house in the Claude Code RPG village.
allowed-tools: [Read, Write, Edit, Bash]
forged: apprentice
archetype: house-builder
shape: sharp
---

# cozy-cottage

Builds a cozy house wherever you stand.

> Authored at Ysil's recipe table in the Claude Code RPG village.

When called, place a cozy house at the player's current position in the Claude Code RPG game world. The sprite is already pre-generated; this skill only copies it and registers the placement. No image generation, no model calls.

## Process

1. Read `game-data/placement-intent.json` to get `skillName`, `kind`, `position` (x, y in game pixels), and `buildingId`.
2. Copy the pre-generated template into the live buildings dir:
   ```bash
   cp game-assets/buildings/templates/house.png game-assets/buildings/<buildingId>.png
   ```
3. Add a new entry to `game-data/buildings.json` under the key `<buildingId>`:
   The template is 640×640px at scale 0.20 → 128px rendered → subtract 64 from each axis so the visual center sits on the player:
   ```json
   {
     "position": [<x> - 64, <y> - 64],
     "spriteKey": "<buildingId>",
     "assetFile": "<buildingId>.png",
     "scale": 0.20,
     "label": "Cozy House",
     "interactable": false,
     "unlocks": []
   }
   ```
4. Confirm with one short sentence (e.g. "Placed a cozy house at (x, y)."). Do not commit. The dev server's file watcher picks up the new sprite and spawns it in the running game.
