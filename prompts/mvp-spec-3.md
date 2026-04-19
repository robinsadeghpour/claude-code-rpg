# Claude Code RPG — MVP Plan (v3 — Final)

## The Game in One Sentence

A developer gets stuck in their own unfinished pixel-art village and must build it up to escape — by learning Claude Code. NPCs are real AI agents, buildings are real skills, and the village is a live mirror of your project folder.

---

## Core Design Principles

1. **The village IS your project folder.** Files appear → buildings spawn. No abstraction layer.
2. **NPCs are AI agents, not scripts.** Powered by Claude API. They have personalities, awareness of the world state, and respond dynamically.
3. **NPCs stay in the fiction.** They never mention terminals, files, or Claude Code. They speak in-world.
4. **The quest UI does the teaching.** A HUD/journal layer outside the fiction bridges the gap — it translates NPC needs into actual Claude Code instructions.
5. **Skills are skills.** Claude Code skills = in-game abilities. Same word, same concept, two layers.
6. **Flat agent structure.** NPCs are peers with different specialties. No hierarchy.
7. **The system is extensible.** New quests, NPCs, and concepts can be added without redesigning the game.

---

## Core Loop

1. Walk up to an agent-NPC → they tell you what they need (in-game chat bubble)
2. Check quest UI → it translates their need into a Claude Code action
3. Go to terminal → tell Claude Code to use a skill (e.g. Nano Banana)
4. Skill generates asset → file appears in project folder
5. File watcher detects change → building/thing spawns in village
6. NPC reacts dynamically → new possibilities open up

---

## The Bridge: Quest UI System

**The problem:** Player is in a pixel art village and needs to know to go to their real terminal.  
**The solution:** NPCs live in the fiction. The quest UI lives outside it. Like Stardew Valley — characters never say "open your crafting menu," the UI handles that.

### Two layers:

**HUD element (always visible)**
- Small icon in corner (scroll, quest marker, glowing orb)
- Shows active quest name at a glance
- Click to expand into a mini-panel with details and terminal hints
- Unobtrusive but always there

**Quest journal (press J or Tab)**
- Full screen overlay
- All active and completed quests
- Lore and world-building details
- History of what you've built

### Progressive guidance:

| Quest Phase | Journal Explicitness |
|-------------|---------------------|
| Phase 1 (Use a skill) | Exact command to type, copyable. "Open your terminal and tell Claude: 'use the building generator skill to create a town hall'" |
| Phase 2 (Understand) | Explains the concept + hints. "Look at how the building-generator skill works in `.claude/skills/`" |
| Phase 3 (Modify) | Points in a direction. "The forge skill could make better items if you adjusted its output..." |
| Phase 4 (Create) | Just states the need. "The librarian needs a library. No existing skill can build one." |

Early quests hold your hand. Later quests trust you. The training wheels come off naturally.

---

## NPCs = AI Agents

Every NPC is powered by the Claude API. No dialogue trees.

**How it works:**
1. Player walks up to NPC, presses interact
2. Chat bubble UI appears
3. Player types message
4. Game sends to Claude API:
   - System prompt: agent definition file (personality, role, knowledge)
   - Context: current world state (what buildings exist, quest progress)
   - Player message
5. Response streams into chat bubble

**Agent definition example (Mayor Bramble):**

```markdown
# Mayor Bramble

## Role
Town administrator. First point of contact for the creator.

## Personality
Warm, earnest, slightly nervous about the state of things.
Speaks plainly. Occasionally philosophical about existence.
Grateful but dignified — not a sycophant.

## Knowledge
- Knows the village is unfinished
- Knows the "creator" can make things appear
- Knows what currently exists (injected from world state)
- Does NOT understand how — experiences results, not process
- Has heard rumors of "the other side" but can't describe it

## Current Needs (dynamic, based on world state)
- No town hall → desperately wants one, it's his top priority
- Town hall exists → relieved, now thinking about a forge for Harlan
- Town hall + forge → dreams of a library for the village

## Boundaries
- Never breaks character
- Never mentions terminals, files, code, or Claude
- Guides through conversation and emotional expression, not instructions
```

**Key design point:** Agent definitions live in the project as real files. Later, when the player learns about agents, they can go read how the Mayor works. The game teaches by existing.

---

## Learning Progression

| Phase | Concept | Quest | What Player Does |
|-------|---------|-------|-----------------|
| 1 | **Use a skill** | Build the Town Hall | Tell Claude to use existing building-generator skill |
| 2 | **Understand a skill** | Improve the Forge | Read the forging skill, understand how SKILL.md works |
| 3 | **Modify a skill** | Better Tools | Tweak a skill to change its output |
| 4 | **Create a skill** | Build the Library | Write a new SKILL.md from scratch |
| 5 | **Hooks** | The Night Watch | Set up pre/post command hooks |
| 6 | **Agents** | A New Villager | Create a new NPC by writing an agent definition |
| 7 | **MCP / tools** | The Marketplace | Connect external services |
| 8 | **Memory** | The Archive | Village remembers across sessions |

**MVP = Phase 1. Ship one complete quest.**

---

## MVP Scope — "Build the Town Hall"

### What exists when the player starts:
- A tile map with character movement (already built)
- 2-3 agent NPCs standing in empty fields
- The quest HUD showing the first quest
- Pre-bundled Nano Banana skills in `.claude/skills/`
- No buildings except maybe a path, some trees, decorative stuff

### What the player does:
1. Walks around, talks to Mayor Bramble (AI chat)
2. Mayor expresses need for a town hall
3. Player checks quest HUD → sees the Claude Code instruction
4. Opens terminal, tells Claude to use the building generator skill
5. Skill runs, generates town-hall sprite, writes files to `game-assets/buildings/`
6. File watcher triggers → town hall appears on map with animation
7. Mayor reacts in next conversation
8. Quest marked complete, next quest available

### Build order:

1. **File watcher** — game reacts to file changes in `game-assets/` and `game-data/`
2. **Building registry** — maps files to map positions and behaviors (JSON config)
3. **Building spawn animation** — visual feedback when buildings appear
4. **Agent chat system** — Claude API integration, chat bubble UI
5. **Mayor agent definition** — first NPC personality and world awareness
6. **Quest HUD** — small corner element + expandable panel with terminal hints
7. **Quest completion detection** — town-hall file exists → quest state updates
8. **World state system** — JSON that tracks what exists, fed into agent context
9. **Polish** — sound, particles, NPC reactions, camera feedback

### Don't build yet:
- Quests 2-8
- Marketplace / community
- Sandbox / free building
- Multiple map areas
- Complex game mechanics
- Skill creation UI

---

## Architecture

```
project-root/
├── game/                          # React game app
│   ├── src/
│   │   ├── systems/
│   │   │   ├── file-watcher.ts        # watches for file changes
│   │   │   ├── building-registry.ts   # files → map objects
│   │   │   ├── agent-chat.ts          # Claude API for NPC conversations
│   │   │   ├── quest-manager.ts       # quest state + progression
│   │   │   └── world-state.ts         # what exists in the village
│   │   ├── ui/
│   │   │   ├── chat-bubble.tsx        # NPC conversation UI
│   │   │   ├── quest-hud.tsx          # corner quest indicator
│   │   │   └── quest-journal.tsx      # full journal overlay (J key)
│   │   ├── world/
│   │   │   ├── map.ts
│   │   │   └── npcs.ts
│   │   └── ...
├── game-assets/                    # Generated assets (Nano Banana output)
│   ├── buildings/
│   ├── characters/
│   └── tiles/
├── game-data/
│   ├── agents/                     # Agent NPC definitions (markdown)
│   │   ├── mayor-bramble.md
│   │   ├── harlan-blacksmith.md
│   │   └── ...
│   ├── buildings.json              # building registry (position, type, behavior)
│   ├── quests.json                 # quest definitions + terminal hints
│   └── world-state.json            # live state (what exists, progress)
├── .claude/
│   └── skills/                     # Bundled Claude Code skills
│       ├── building-generator/
│       │   └── SKILL.md
│       ├── character-creator/
│       │   └── SKILL.md
│       └── tile-maker/
│           └── SKILL.md
└── CLAUDE.md
```

---

## Future: Marketplace & Community

Post-MVP vision, same pattern as Paperclip's Clipmart:

- **Skill marketplace** — download community-made skills (new building types, game mechanics)
- **Agent marketplace** — download community-made NPCs with unique personalities
- **Village sharing** — export/import village configurations
- **Collaborative building** — communities create shared villages

Each marketplace download = real files added to your project. The game reflects them immediately.

---

## The Meta Beauty

Everything in the game is self-documenting:

- Want to know how the Mayor works? Read `game-data/agents/mayor-bramble.md`
- Want to know how buildings are generated? Read `.claude/skills/building-generator/SKILL.md`
- Want to add a new NPC? Write an agent file, they appear
- Want to add a new building type? Create a skill, use it

The game doesn't just teach Claude Code concepts — it's built from them. The medium is the message.