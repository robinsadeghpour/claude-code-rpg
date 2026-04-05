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
  "position": { "x": 12, "y": 8 },
  "state": "glitched",
  "catchphrase": "The iron remembers, even when I don't.",

  "personality": {
    "trait": "Patient, methodical, deeply frustrated by his sudden incompetence",
    "speechPattern": "Speaks in measured sentences. Pauses mid-thought. Trails off when the glitch hits.",
    "quirk": "Taps his hammer on the anvil rhythmically while talking, but the rhythm skips a beat every few taps"
  },

  "dialogue": {
    "glitched": [
      { "speaker": "Harlan", "text": "Ah, hello there. I'd offer you something freshly forged, but..." },
      { "speaker": "Harlan", "text": "My hands know the motions. Heat, fold, strike. But somewhere between fold and strike, I just..." },
      { "speaker": "Harlan", "text": "...forget what I was making. Every single time." }
    ],
    "questGiving": [
      { "speaker": "Harlan", "text": "You seem like someone who notices things others miss." },
      { "speaker": "Harlan", "text": "There's a pattern to my work. It used to flow — preparation, then the craft, then the finishing touch." },
      { "speaker": "Harlan", "text": "Now the preparation step just... vanishes. Like it was never there." },
      { "speaker": "Harlan", "text": "Could you take a look? The old ritual board behind my shop might have answers." }
    ],
    "healed": [
      { "speaker": "Harlan", "text": "The rhythm's back. Heat, fold, strike — all of it, in order, every time." },
      { "speaker": "Harlan", "text": "I don't know what you did, but my hands remember again. Thank you, friend." }
    ]
  },

  "sprite": {
    "idle": "sprite-blacksmith-idle",
    "glitched": "sprite-blacksmith-glitched",
    "healed": "sprite-blacksmith-healed"
  },

  "questId": "quest-forgotten-pattern",

  "_creatorNote": "Teaches hooks (pre-command hooks). Harlan's 'preparation ritual' is the metaphor for a hook that runs before the main action. His glitch is that the pre-hook is missing — so the preparation step gets skipped, and his forging fails. The terminal challenge has the player restore the preparation ritual to the sequence."
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
- Glitch variant: same pose but every 3rd frame the hammer teleports to wrong hand, apron flickers between brown and purple
- Healed variant: same as idle but subtle warm glow, relaxed posture
- Style: Stardew Valley villager proportions — large head, small body, expressive eyes
```

## NPC Design Rules

### Personality
- Every NPC needs a distinct speech pattern that's recognizable within 2 lines of dialogue
- Glitched dialogue should feel *off* but not broken — the NPC is struggling, not corrupted
- Healed dialogue should feel genuinely warm — not performative gratitude
- Keep dialogue lines under 80 characters where possible (fits the dialogue box cleanly)
- Aim for 3-4 lines per dialogue state (glitched, questGiving, healed)

### Concept Mapping
- The NPC's glitch symptom must be a natural metaphor for the Claude Code concept
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
- Their problem is relatable on a human level (forgetting things, losing track, feeling stuck)
- Their personality exists independent of their glitch — they have hobbies, opinions, history
- They react to being healed with genuine surprise, not scripted thanks
- They feel like someone you'd want to talk to again even after the quest is done

### Naming
- Warm, slightly unusual names — not fantasy clichés (no "Eldric" or "Thorin")
- Names should feel like a cozy village: Harlan, Luma, Wren, Cosmo, Mabel, Fen, Dottie
- One-word names preferred for UI space

## Quality Checks

Before finalizing, verify:
- [ ] No code terminology anywhere in dialogue (no "debug," "function," "error," "variable")
- [ ] Glitch symptom clearly maps to a Claude Code concept (check _creatorNote)
- [ ] Speech pattern is distinct and consistent across all dialogue states
- [ ] Dialogue lines fit under 80 characters
- [ ] Sprite spec includes idle, glitched, and healed variants
- [ ] Position coordinates are reasonable for the specified area
- [ ] JSON is valid and matches the schema exactly
