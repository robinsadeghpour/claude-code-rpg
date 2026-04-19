---
name: generate-npc
description: "Generates a complete NPC for Claude Code RPG — character data JSON, dialogue trees, and sprite handoff notes. Use this skill whenever creating a new village character, populating a new area, or expanding the cast. Always consult brand-and-tone first. Output includes game-ready JSON plus a sprite brief for the character pipeline skills. The NPC teaches a Claude Code concept through metaphor — never through direct reference."
---

# Generate NPC — Claude Code RPG

Creates a fully realized NPC ready for implementation. Output is a JSON file that plugs directly into the game's NPC system plus a sprite brief for downstream sprite generation.

Before generating, read the `brand-and-tone` skill for palette, tone rules, and the concept-to-metaphor mapping table. Every NPC must comply with those constraints.

## Input

You need these details (ask the creator if not provided):

1. **Which Claude Code concept** does this NPC teach? (e.g., skills, hooks, context management, MCP servers, slash commands, plan mode)
2. **What area** do they belong to? (e.g., village square, library, forge, farm)
3. **Any personality direction?** (optional — if not given, invent something memorable)

## Output

Generate two things:

### 1. NPC Data JSON

Save to `src/data/npcs/npc-{id}.json`. Follow this exact schema:

```json
{
  "id": "blacksmith",
  "name": "Harlan",
  "role": "Village Blacksmith",
  "area": "village-square",
  "position": { "x": 180, "y": 280 },
  "state": "waiting",
  "catchphrase": "The iron remembers, even when I don't.",

  "personality": {
    "trait": "Patient, methodical, frustrated by having no workshop",
    "speechPattern": "Speaks in measured sentences. Pauses mid-thought.",
    "quirk": "Taps his hammer on his palm rhythmically while talking"
  },

  "dialogue": {
    "intro": [
      { "speaker": "Harlan", "text": "I'd offer you something freshly forged, but..." },
      { "speaker": "Harlan", "text": "My hands know the motions. Heat, fold, strike." },
      { "speaker": "Harlan", "text": "But I've got no forge to work with. Just an empty lot." },
      { "speaker": "Harlan", "text": "A blacksmith without a forge. What a sorry sight." }
    ],
    "reminder": [
      { "speaker": "Harlan", "text": "Still no forge. I keep coming back to this spot though." },
      { "speaker": "Harlan", "text": "My work used to flow — preparation, then the craft." },
      { "speaker": "Harlan", "text": "Can't do any of that without a proper workshop." }
    ],
    "fulfilled": [
      { "speaker": "Harlan", "text": "A real forge. Now I can get to work." },
      { "speaker": "Harlan", "text": "I don't know what you did, but my hands remember again. Thank you, friend." }
    ]
  },

  "sprite": {
    "waiting": "npc-blacksmith",
    "fulfilled": "npc-blacksmith-alt"
  },

  "questId": "forgotten-prep",

  "_creatorNote": "Teaches hooks (pre-command hooks). Harlan needs a forge built before he can work. His quest later teaches that preparation steps (hooks) must run before the main action."
}
```

### 2. Sprite Brief

Output a description block that `generate-character-sprite` can use as character design input.
If SVG is explicitly requested, this same brief can also be passed to `generate-svg-sprite`.

```
SPRITE SPEC: blacksmith
- Size: 16x32px (1 tile wide, 2 tall)
- Palette: terracotta skin, warm brown leather apron, charcoal pants, peach shirt underneath
- Props: hammer in right hand, small anvil nearby
- Idle pose: standing, slight lean forward, hammer resting at side
- Fulfilled variant: same as idle but subtle warm glow, relaxed posture
- Style: Stardew Valley villager proportions — large head, small body, expressive eyes
```

## NPC States

NPCs have two states that reflect the "build up the village" narrative:

| State | Meaning |
|-------|---------|
| `waiting` | NPC is waiting for something to be built or a quest to be completed |
| `fulfilled` | Quest is done, NPC is grateful and the village has grown |

There is no "glitched" state — the village isn't broken, it's empty. NPCs are lonely, wanting, hopeful — not corrupted.

## Dialogue Keys

| Key | When shown | Tone |
|-----|-----------|------|
| `intro` | First time the player talks to this NPC | Introduce themselves, express what they need |
| `reminder` | Player returns without completing the quest | Gently remind what they're waiting for |
| `fulfilled` | Quest is complete | Genuine warmth, gratitude, point to next need |

## NPC Design Rules

### Personality
- Every NPC needs a distinct speech pattern that's recognizable within 2 lines of dialogue
- Waiting dialogue should feel wistful or hopeful — the NPC wants something, not something is wrong with them
- Fulfilled dialogue should feel genuinely warm — not performative gratitude
- Keep dialogue lines under 80 characters where possible (fits the dialogue box cleanly)
- Aim for 3-4 lines per dialogue state (intro, reminder, fulfilled)

### Concept Mapping
- The NPC's need must be a natural metaphor for the Claude Code concept
- The metaphor should be intuitive enough that after playing, someone could say "oh, that's like hooks" — but during play, it just feels like a story
- Reference the concept-to-metaphor table in brand-and-tone:
  - Skills → recipes, scrolls, craft patterns
  - Hooks → preparation and follow-through rituals
  - Context → village memory, the town ledger
  - MCP → trade routes, messenger birds
  - Plan mode → architect's table, blueprints
  - Agent mode → helper spirits
  - CLAUDE.md → the village charter

### What Makes a Good NPC
- Their need is relatable on a human level (wanting a workspace, feeling lonely, needing tools)
- Their personality exists independent of their quest — they have hobbies, opinions, history
- They react to fulfillment with genuine surprise, not scripted thanks
- They feel like someone you'd want to talk to again even after the quest is done

### Naming
- Warm, slightly unusual names — not fantasy clichés (no "Eldric" or "Thorin")
- Names should feel like a cozy village: Harlan, Luma, Wren, Cosmo, Mabel, Fen, Dottie
- One-word names preferred for UI space

## Quality Checks

Before finalizing, verify:
- [ ] No code terminology anywhere in dialogue (no "debug," "function," "error," "variable")
- [ ] NPC need clearly maps to a Claude Code concept (check _creatorNote)
- [ ] Speech pattern is distinct and consistent across all dialogue states
- [ ] Dialogue lines fit under 80 characters
- [ ] Sprite spec includes waiting and fulfilled variants
- [ ] Position coordinates are reasonable for the specified area
- [ ] JSON is valid and matches the schema exactly
