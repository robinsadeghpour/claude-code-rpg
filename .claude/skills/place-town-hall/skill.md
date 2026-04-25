---
name: place-town-hall
description: Use this skill when the user asks to build, place, or create a town hall in the Claude Code RPG village.
allowed-tools: [Read, Bash]
user-invocable: true
---

# place-town-hall

Places the village's town hall using the pre-generated sprite that already lives in this repo.

This skill does NOT call Gemini, nano-banana, or any image-generation model. The sprite is already on disk — this skill only copies it to the location the game watches.

## Process

1. Copy the sprite using Node.js (cross-platform — works on Windows, Mac, Linux, iOS):
   ```bash
   node -e "require('fs').copyFileSync('game-assets/buildings/town-hall/building-town-hall.png', 'game-assets/buildings/town-hall.png')"
   ```
2. Verify it landed and world-state reflects it:
   ```bash
   cat game-data/world-state.json
   ```
3. Confirm with one short sentence (e.g. "Placed the town hall in the village square.").

The town hall is already registered in `game-data/buildings.json` under the `town-hall` key, so no registry edit is needed. The dev server's file watcher detects the new PNG, updates `game-data/world-state.json`, and the building spawner renders it in the running game. Mayor Bramble's quest checker (`town-hall-exists`) then trips and the heal moment fires.

## Rules

- Do not generate or regenerate the sprite. The asset is final.
- Do not edit `game-data/buildings.json`.
- Do not commit. The dev server picks up the file automatically.
