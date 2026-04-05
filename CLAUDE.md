# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code RPG — A cozy, Stardew Valley-style RPG where players learn Claude Code by finding and fixing real bugs in the game world. Built with Vite, React, TypeScript, and the Kaplay game framework.

## Tech Stack

- **Build Tool:** Vite 6
- **Runtime:** React 19 + TypeScript 5.7
- **Game Framework:** Kaplay 3001 (scene management, sprites, input, physics)
- **Styling:** Tailwind CSS 4 + PostCSS
- **State Management:** Zustand 5
- **Dev Server:** Vite (port 5173)

## Project Structure

- **src/game/** — Core game logic
  - `scenes/` — Menu, world, transition scenes
  - `systems/` — Quest, glitch, crafting systems
  - `entities/` — Player, NPC game objects
  - `assets.ts` — Asset loading (sprites, tiles)
  - `init.ts` — Game initialization
- **src/ui/** — React UI overlay components (dialogue box, quest journal, HUD, heal overlay)
- **src/data/** — Game data (JSON)
  - `quests/` — Quest definitions with intentional bugs
  - `areas/` — Area/map definitions
  - `npcs/` — NPC dialogue and behavior
- **src/server/** — Vite plugin for Claude API integration
- **src/store/** — Zustand state stores
- **public/assets/** — Static game assets (sprites, tiles)

## Common Commands

```bash
pnpm dev      # Start Vite dev server at localhost:5173
pnpm build    # TypeScript check + Vite production build
pnpm preview  # Preview production build
```

## Architecture

### Game Loop (Kaplay)
The game runs on Kaplay's scene system. Player input (WASD movement, E to interact) is handled by Kaplay's event system. Scenes: menu → transition → world.

### Quest System
Quests contain intentional bugs in the codebase. NPCs provide hints about what's broken. Players use Claude Code to find and fix bugs in `src/game/*` and `src/data/*`, then return to the NPC to trigger quest-check validators (`src/game/systems/quest-checks.ts`).

### Glitch Effects
Visual glitches are applied via the glitch system (`src/game/systems/glitch.ts`) and removed when bugs are fixed, creating "heal moments" with visual effects.

### UI Layer
React components overlay the Kaplay canvas. Zustand bridges game state to React for dialogue, HUD, and journal updates.

## Coding Conventions

- TypeScript strict mode
- Kaplay entity-based game objects for the canvas layer
- React for all menu/dialogue/HUD UI
- Zustand for cross-component state (game store)
- Keep game logic in `src/game/`, UI in `src/ui/`

## Environment

Pure client-side game — no backend required. The Vite dev server handles everything. No `.env` file needed for local development.
