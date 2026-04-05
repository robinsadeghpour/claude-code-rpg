# Claude Code RPG — MVP Plan (v2)

## The Game in One Sentence

A developer gets stuck in their own unfinished pixel-art village and must build it up to escape — by learning Claude Code. NPCs are real AI agents, buildings are real skills, and the village is a live mirror of your project folder.

---

## Core Loop

1. Walk up to an agent-NPC → they tell you what they need (in-game chat bubble, powered by Claude API)
2. Go to your terminal → tell Claude Code to use a skill (e.g. Nano Banana) to build it
3. The skill generates the asset → file appears in project folder
4. Game's file watcher detects the file → building/thing spawns in the village
5. NPC reacts dynamically ("you built it!") → new possibilities open up

The game IS the codebase. The village IS your `.claude/` folder made visible.

---

## NPCs = Agents (Not Scripts)

Every NPC is an AI agent. No dialogue trees, no canned responses.

Each agent is defined by a file in `.claude/agents/` (or `game-data/agents/`):
- **Name and role** — Mayor Bramble, town administrator
- **Personality** — warm, slightly anxious about the empty village
- **Knowledge** — what they know about, what they care about
- **Current needs** — what they're waiting for (dynamically updated from world state)

When the player interacts with an NPC:
- Game reads the agent's definition file
- Game reads current world state (what buildings exist, quest progress)
- Sends both as system prompt + context to Claude API (Sonnet for speed/cost)
- Response appears as in-game chat bubble

**This means:**
- NPCs give contextual hints naturally ("I notice you built a forge but it has no tools yet...")
- NPCs adapt to the player's skill level
- NPCs can answer questions about Claude Code concepts in-character
- No scripting needed — just good agent definitions
- Later, creating a new NPC IS the lesson on creating agents

**Flat structure** — agents are peers with different specialties, not a hierarchy. The Mayor isn't the Blacksmith's boss. They're neighbors with different knowledge.

---

## Learning Progression

| Phase | Concept | In-Game Manifestation |
|-------|---------|----------------------|
| 1 | **Use a skill** | Tell Claude to use Nano Banana skill to build a town hall |
| 2 | **Understand a skill** | Read how the building generator works, understand SKILL.md |
| 3 | **Modify a skill** | Tweak the skill to generate a different kind of building |
| 4 | **Create a skill** | Write a new SKILL.md from scratch → new building type |
| 5 | **Hooks** | Set up pre/post command hooks (e.g. auto-backup before changes) |
| 6 | **Agents** | Create a new NPC by writing an agent definition file |
| 7 | **MCP / tools** | Connect external services (the marketplace) |
| 8 | **Memory** | Village remembers things across sessions |

**MVP = Phase 1 only.**

---

## MVP Scope — "Build the Town Hall"

### Player Experience

1. Game opens. You're a developer. Something went wrong and you're inside your own unfinished game.
2. A mostly-empty village. A few agent-NPCs standing around in empty fields.
3. Walk up to Mayor Bramble. He talks to you (live AI chat bubble):
   *"You're... the creator? Look around — there's nothing here. I'm supposed to be a mayor but I don't even have a town hall. Can you build one? I've heard you can do things from... outside this world."*
4. The Mayor can answer questions, give hints, explain what a "skill" is — all dynamically.
5. Player goes to terminal, tells Claude Code: "Use the building generator skill to create a town hall"
6. Claude runs the Nano Banana skill → generates town hall sprite → writes files to project
7. File watcher detects new asset → town hall appears on the map with a spawn animation
8. Walk back to Mayor. He sees it, reacts dynamically: *"It's... it's real! You actually did it!"*
9. Town hall unlocks the next NPC/quest becoming available

### What to Build (in order)

**1. File watcher system** (the spine)
- Watches `./game-assets/buildings/` and `./game-data/` for changes
- When a new file appears → triggers an event the game can react to
- When a file is removed → corresponding thing disappears
- This is the foundation everything else depends on

**2. Asset-to-map pipeline** (the bridge)
- A registry/manifest mapping files to map positions and behaviors
- e.g. `town-hall.png` → position (12, 8), type "building", interaction "quest-board"
- Simple JSON config:
  ```json
  {
    "town-hall": {
      "position": [12, 8],
      "sprite": "town-hall.png",
      "type": "building",
      "unlocks": ["blacksmith-quest"],
      "interactable": true
    }
  }
  ```

**3. Building spawn system** (the juice)
- Animate buildings appearing when detected
- Player can walk up and interact
- Each building type has a behavior (functional, not just visual)

**4. Agent-NPC chat system** (the soul)
- Chat bubble UI that appears when you walk up to and interact with an NPC
- Player types message → sent to Claude API with agent context
- Response streams into chat bubble
- Agent definition files read from project folder
- World state injected into every conversation

**5. First quest flow**
- Mayor agent definition (personality, role, needs)
- Quest detection: town-hall asset exists → quest state updates
- World state updates → Mayor's next conversations reflect the change
- Unlock trigger: quest 1 done → next NPC/area becomes available

**6. Onboarding hint**
- Mayor's agent definition includes knowledge about "the outside" (your terminal)
- He can naturally say things like "I've heard you can speak to something called Claude from the other side..."
- No separate tutorial needed — the agent IS the tutorial

### What NOT to Build Yet

- More than 2-3 agent NPCs
- Skill creation/modification quests (phases 2-4)
- Marketplace or community features
- Sandbox/free building mode
- Multiple map areas
- Complex game mechanics (crafting, inventory, etc.)

---

## Agent Definition Format

Each NPC is a file. Example for the Mayor:

```markdown
# Mayor Bramble

## Role
Town administrator. First point of contact for the creator.

## Personality
Warm, earnest, slightly nervous. Grateful but not obsequious. 
Speaks plainly. Occasionally philosophical about the nature of his world.

## Knowledge
- Knows the village is unfinished and that the "creator" can build things
- Knows what buildings currently exist (injected from world state)
- Understands the concept of "skills" as tools the creator uses
- Can explain what a skill is in simple, in-character terms
- Does NOT know technical details — he experiences results, not process

## Current Needs
- If no town hall: desperately wants a town hall
- If town hall exists: wants a forge for the blacksmith next
- If forge exists: talks about wanting a library

## Boundaries
- Stays in character — never breaks the fourth wall about being an AI
- Doesn't write code or give exact file paths
- Guides through conversation, not instruction dumps
```

The game reads this file and uses it as the system prompt, combined with current world state.

---

## Architecture

```
project-root/
├── game/                        # React game app
│   ├── src/
│   │   ├── systems/
│   │   │   ├── file-watcher.ts      # watches project folder for changes
│   │   │   ├── building-registry.ts # maps files → map objects
│   │   │   ├── agent-chat.ts        # Claude API calls for NPC chat
│   │   │   └── quest-manager.ts     # tracks world state and progression
│   │   ├── ui/
│   │   │   └── chat-bubble.tsx      # in-game chat UI
│   │   ├── world/
│   │   │   ├── map.ts
│   │   │   └── npcs.ts
│   │   └── ...
├── game-assets/                  # Generated assets land here
│   ├── buildings/
│   ├── characters/
│   └── tiles/
├── game-data/
│   ├── agents/                   # Agent NPC definitions
│   │   ├── mayor-bramble.md
│   │   ├── harlan-blacksmith.md
│   │   └── ...
│   ├── buildings.json            # building registry
│   └── world-state.json          # current state (what exists, quest progress)
├── .claude/
│   └── skills/                   # Claude Code skills (bundled)
│       ├── building-generator/
│       │   └── SKILL.md
│       ├── character-creator/
│       │   └── SKILL.md
│       └── tile-maker/
│           └── SKILL.md
└── CLAUDE.md
```

---

## Future Vision (Post-MVP)

**Marketplace / Community:**
- Browse and download community-made skills (new building types)
- Browse and download community-made agents (new NPCs)
- Share your village creations
- Inspired by Paperclip's "Clipmart" concept

**Sandbox Mode:**
- Free build mode — create any building with custom skills
- Nano Banana generates unique art for player-created buildings
- Players can create entirely new NPCs by writing agent definitions

**Advanced Concepts:**
- Each new Claude Code concept = new quest arc
- Hooks, subagents, MCP, memory all have in-game manifestations
- Creating a new NPC teaches you about agents
- Connecting the marketplace teaches you about MCP
- Village remembering your progress teaches you about memory/context

---

## Build Order (Start Here)

1. File watcher → game reacts to file system changes
2. Building registry → files map to map positions
3. Building spawn animation → visual feedback when things appear
4. Agent chat system → Claude API powering NPC conversations
5. Mayor agent definition → first NPC with personality and world awareness
6. Quest completion detection → town hall exists = quest done
7. Polish → sound, particles, NPC reactions