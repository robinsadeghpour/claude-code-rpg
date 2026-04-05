---
name: brand-and-tone
description: "Foundation skill for Claude Code RPG — the cozy pixel-art learning RPG that teaches Claude Code through gameplay. Consult this skill FIRST before generating any game content: NPCs, quests, dialogue, world areas, UI text, asset descriptions, or code architecture decisions. This skill defines the visual identity, color palettes, tone of voice, narrative rules, and the strict metaphor-only teaching philosophy. Use it whenever working on any part of the Claude Code RPG project, even if another skill is also active — this one sets the creative constraints all others must follow."
---

# Claude Code RPG — Brand & Tone Foundation

This is the creative bible for Claude Code RPG. Every skill, every asset, every line of dialogue must pass through these constraints.

## What This Game Is

A browser-based 2D RPG (Stardew Valley aesthetic, top-down pixel art) where a developer gets pulled into a glitched village. The world is cozy but broken. Players fix it by solving quests that secretly teach Claude Code concepts — but the game never says "Claude Code." Everything is metaphor, narrative, and discovery.

## The Golden Rule

**In-world content never references code, programming, terminals, APIs, functions, or developer tools directly.** The game world has its own logic. A skill that helps NPCs remember things is just "the village memory." A hook that runs before actions is "the preparation ritual." The player learns concepts by osmosis, not instruction.

The only place real Claude Code terminology appears is in `[CREATOR NOTE]` blocks — private annotations for content creators that never render in-game.

## Visual Identity

### Healthy World Palette
- Background: warm cream `#FFF8E7`, soft sage `#C5D5A5`
- Accents: peach `#FFB088`, lavender `#C4A8D8`, mint `#88D4B0`, sunbeam yellow `#FFE066`
- Skin/warmth: terracotta `#C67B5C`, warm brown `#8B6549`
- Neutrals: soft charcoal `#3A3A3A`, warm gray `#7A7A7A`

### Glitched World Palette
- Corrupted overlay: cyan `#00FFD4` at 30% opacity, magenta `#FF00FF` at 20%
- Desaturated base: drain saturation 40-60% from healthy palette
- Glitch accents: electric purple `#9B30FF`, error red `#FF3355`
- Scanline color: `rgba(0, 0, 0, 0.08)` repeating every 2px

### Healed Transition
When a zone heals, the visual progression is: glitched palette → brief white flash (200ms) → colors bloom outward from the fix point → healthy palette settles in with a gentle overshoot (slightly oversaturated for 500ms, then normalizes).

## Pixel Art Specifications
- Tile size: 16x16px base grid
- Character sprites: 16x32px (1 tile wide, 2 tiles tall)
- Sprite scale: render at 3x (48x96px on screen)
- Style: top-down with slight 3/4 perspective (like Stardew Valley)
- No outlines on terrain, thin 1px dark outlines on characters/objects
- Limited color count per sprite: aim for 6-10 colors max

## Typography
- In-world dialogue: pixel font (e.g., "Press Start 2P" or "Munro")
- Terminal/magic UI: monospace pixel font (e.g., "IBM Plex Mono" at small size, or "Silkscreen")
- Menu/HUD: clean pixel font matching dialogue font
- Never use system fonts or modern sans-serif anywhere in the game

## Sound Direction (Reference Only — Implementation Later)
- Healthy zones: lo-fi ambient, gentle wind, birdsong, soft piano
- Glitched zones: same base but with stutter effects, bit-crushed artifacts, off-key notes
- Heal moment: signature ascending chime (warm, bell-like, 3-note resolution)
- UI: soft clicks, page turns for dialogue, subtle whoosh for terminal open/close

## Tone of Voice

### NPC Dialogue
- Warm, slightly confused, endearing
- NPCs sense something is wrong but describe it in their own terms: "My hammer keeps forgetting" not "there's a bug in the forge function"
- Fourth-wall adjacent: they hint at oddness without knowing they're in a game
- Each NPC has a distinct speech pattern — one might trail off, another might repeat phrases, another might speak in short bursts
- No exclamation marks in more than 20% of dialogue lines (keep it chill)

### Terminal / Magic Interface Text
- Dry, witty, encouraging
- Error messages are playful: "Hmm, that spell fizzled. The pattern doesn't quite match." not "Error: invalid input"
- Success messages are warm but brief: "Something shifts. The air feels lighter." not "Congratulations! You solved the puzzle!"
- Never condescending, never tutorial-like

### Narrator / System Text
- Minimal — only when absolutely needed for onboarding
- Observational, not directive: "The fountain in the square has stopped flowing" not "Go to the fountain and fix it"
- Present tense, second person: "You notice" not "The player sees"

## Teaching Philosophy

### How Concepts Map to World Logic
Claude Code concepts become world mechanics through consistent metaphor:

| Claude Code Concept | World Metaphor |
|---|---|
| Skills (.md files) | Recipes, scrolls, craft patterns |
| Slash commands | Gestures, rituals, spoken phrases |
| Hooks (pre/post) | Preparation and follow-through rituals |
| Context management | Village memory, the town ledger |
| MCP servers | Trade routes, messenger birds, connections to other villages |
| Plan mode | The architect's table, blueprint reading |
| Agent mode | Letting the helper spirits work |
| CLAUDE.md | The village charter, the founding document |

### Learning Progression
1. **Discovery** — Player encounters a glitch (symptom of a concept gap)
2. **Investigation** — Talking to NPCs reveals the nature of the problem in metaphor
3. **Action** — Terminal challenge frames the concept as a puzzle with in-world logic
4. **Resolution** — Solving it heals the world and the player intuitively grasps the concept
5. **Reinforcement** — The healed NPC/area now demonstrates the concept working correctly

### What We Never Do
- Explain the real concept during gameplay
- Use terms like "function," "API," "debug," "code," "variable," "parameter"
- Show real code syntax in the terminal (it's always metaphorical commands)
- Break the fourth wall completely — the closest we get is NPCs sensing something is "off"
- Punish wrong answers — wrong terminal inputs get playful redirects

## File & Asset Naming Conventions
- Sprites: `sprite-{entity}-{state}.svg` (e.g., `sprite-blacksmith-idle.svg`, `sprite-blacksmith-glitched.svg`)
- Tiles: `tile-{area}-{type}.svg` (e.g., `tile-village-grass.svg`, `tile-village-path.svg`)
- Portraits: `portrait-{npc}-{emotion}.svg` (e.g., `portrait-librarian-worried.svg`)
- Audio: `audio-{type}-{description}.mp3` (e.g., `audio-ambient-village-healthy.mp3`)
- Data: `{type}-{id}.json` (e.g., `npc-librarian.json`, `quest-forgotten-books.json`)
