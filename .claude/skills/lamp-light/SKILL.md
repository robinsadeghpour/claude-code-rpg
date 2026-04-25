---
name: lamp-light
description: Use this skill when the user asks to place or light a lantern in the Claude Code RPG village.
allowed-tools: [Read, Write, Edit, Bash]
forged: apprentice
archetype: lantern-lighter
shape: sharp
---

# lamp-light

Plants a glowing lantern at your feet.

> Authored at Ysil's recipe table in the Claude Code RPG village.

When called, place a warm lantern at the player's current position in the Claude Code RPG game world. The sprite is already pre-generated; this skill only copies it and registers the placement. No image generation, no model calls.

## Process

1. Read `game-data/placement-intent.json` to get `skillName`, `kind`, `position`, and `buildingId`.
2. Copy the pre-generated template:
   ```bash
   cp game-assets/buildings/templates/lantern.png game-assets/buildings/<buildingId>.png
   ```
3. Add an entry to `game-data/buildings.json`:
   ```json
   {
     "position": [<x>, <y>],
     "spriteKey": "<buildingId>",
     "assetFile": "<buildingId>.png",
     "scale": 0.25,
     "label": "Warm Lantern",
     "interactable": false,
     "unlocks": []
   }
   ```
4. Confirm with one short sentence. The dev server's file watcher will spawn the lantern in the running game.
