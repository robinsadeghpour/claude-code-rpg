---
name: generate-quest
description: "Generates a complete quest for Claude Code RPG — quest data JSON including terminal challenge, heal moment, NPC dialogue hooks, and progression logic. Use this skill whenever creating a new quest, designing a terminal puzzle, or scripting a heal sequence. Always consult brand-and-tone first. Quests teach Claude Code concepts through metaphorical puzzles — the terminal challenge is never real code. Output is a game-ready JSON file that plugs into the quest system."
---

# Generate Quest — Claude Code RPG

Creates a complete quest with terminal challenge, heal moment, and all dialogue hooks. Output is a JSON file ready for the game's quest system.

Before generating, read `brand-and-tone` for tone rules and metaphor mappings, and `game-architecture` for the quest state machine and data schema.

## Input

You need:

1. **Which NPC** gives this quest? (must already exist or be created alongside)
2. **Which Claude Code concept** does the quest teach?
3. **Difficulty level**: beginner (first quest tier), intermediate, or advanced
4. **Any specific narrative direction?** (optional)

## Output

Save to `src/data/quests/quest-{id}.json`. Follow this exact schema:

```json
{
  "id": "forgotten-pattern",
  "title": "The Forgotten Pattern",
  "npcId": "blacksmith",
  "areaId": "village-square",
  "state": "hidden",

  "description": "Harlan the blacksmith can't complete his work — the preparation step keeps vanishing from his routine.",

  "trigger": {
    "type": "npc-dialogue",
    "condition": "Talk to Harlan while his state is 'glitched'"
  },

  "terminal": {
    "prompt": "The ritual board shows a sequence of craft steps, but one is missing.\n\nThe board reads:\n  ??? → heat → fold → strike → cool\n\nEach step flows into the next. The first step sets everything up — without it, the rest falls apart.\n\nWhat comes before the craft begins?",
    "hints": [
      "Think about what a craftsman does before starting work. What needs to happen first?",
      "Harlan mentioned his hands 'know the motions' but the first part vanishes. What's the part that gets things ready?",
      "It's the step that makes sure everything is in place before the real work starts."
    ],
    "acceptedInputs": [
      "prepare",
      "preparation",
      "ready",
      "setup",
      "set up",
      "get ready",
      "prepare materials",
      "gather"
    ],
    "wrongResponses": [
      "The board hums but nothing changes. The missing step isn't about the craft itself — it's about what comes before.",
      "Close, but the board stays dim. Think earlier. Before the heat, before anything begins.",
      "The symbols flicker. You're on the right track — what's the very first thing you'd do?"
    ],
    "successMessage": "The board glows warm. The missing step fills in, and the whole sequence pulses with light. The pattern is complete."
  },

  "healMoment": {
    "duration": 2000,
    "visual": "Harlan's anvil stops flickering. Color spreads outward from the ritual board — warm orange and gold ripple across the forge floor. The scattered tools gently lift and settle into their proper places. Harlan's hammer lands firmly in his right hand and stays.",
    "audio": "Forge crackling normalizes from stuttery to steady rhythm. Three-note ascending chime plays. Ambient warmth increases.",
    "npcReaction": [
      { "speaker": "Harlan", "text": "I can feel it. The rhythm — it's back." },
      { "speaker": "Harlan", "text": "Prepare, then forge. How did I ever forget that?" }
    ],
    "worldChange": "Forge area restored to healthy palette. Anvil no longer flickers. Smoke rises steadily instead of stuttering. Path to the northern fields unlocks."
  },

  "rewards": {
    "unlocksArea": "northern-fields",
    "unlocksNPC": null,
    "worldChange": "Forge area fully restored, steady smoke visible from other areas"
  },

  "_creatorNote": {
    "concept": "Hooks (pre-command hooks)",
    "lesson": "Pre-hooks run before the main command executes. They set up conditions, validate state, or prepare context. Without them, the main action may fail or produce unexpected results. Harlan's 'preparation' step is the pre-hook — it must run before forging begins.",
    "realWorldParallel": "In Claude Code, a pre-hook might validate that a file exists before editing it, or check the git state before committing. The preparation ritual IS the hook."
  }
}
```

## Terminal Challenge Design

The terminal is the core teaching moment. It must be:

### Solvable From Context
The player should have everything they need from NPC dialogue and the terminal prompt itself. No outside knowledge required. If Harlan talked about "preparation vanishing," the answer relates to preparation.

### Metaphorical, Not Technical
- Good prompt: "The ritual board shows a sequence with a missing step"
- Bad prompt: "Write a function that runs before the main process"
- Good accepted input: "prepare", "ready", "gather materials"
- Bad accepted input: "beforeEach", "pre_hook", "init()"

### Progressive Hints
Write 3 hints that get progressively more direct:
1. **Gentle nudge** — reframes the problem from a different angle
2. **Warmer** — recalls something the NPC said
3. **Almost giving it away** — describes the answer concept without saying the word

### Forgiving Input Matching
Accept many variations of the correct concept. Think about how different people would phrase the same idea. Include:
- The exact word
- Synonyms
- Short phrases
- Common misspellings if relevant
- At least 5-8 accepted inputs per challenge

### Wrong Response Variety
Write at least 3 wrong responses. They should:
- Never repeat the same message twice in a row (cycle through them)
- Be encouraging, never punishing
- Gently redirect toward the right thinking
- Feel like the world is responding, not a system: "The board hums but nothing changes" not "Incorrect. Try again."

## Heal Moment Design

The heal moment is the emotional payoff. It must feel earned and transformative.

### Visual Sequence
Describe in terms the game can implement:
- What specific tiles/sprites change?
- How does color return? (ripple outward, fade in, bloom, snap)
- What objects move or settle?
- What was broken that is now visibly fixed?

### Audio Sequence
- How does the glitched audio resolve?
- Include the signature three-note ascending chime
- What ambient sounds change?

### NPC Reaction
- 1-2 lines of genuine, in-character response
- They should notice the change but not fully understand it
- Relief and warmth, not dramatic revelation

### World Changes
- What persists after the heal? (unlocked paths, restored visuals, new ambient details)
- These changes should be visible even if the player leaves and returns

## Difficulty Calibration

### Beginner Quests
- Terminal prompt is very direct, almost tells you the answer in the question
- Only 1-2 wrong attempts before hints start getting very warm
- Short dialogue, fast heal moment
- Teaches the most fundamental concepts (what is a skill, what are slash commands)

### Intermediate Quests
- Terminal prompt requires connecting two pieces of information from NPC dialogue
- Hints are more subtle, 2-3 wrong attempts before strong hints
- More dialogue, richer heal moments
- Teaches applied concepts (hooks, context management)

### Advanced Quests
- Terminal prompt is a multi-step puzzle or requires synthesizing information from multiple NPCs
- Hints are abstract, player needs to think
- Complex heal moments with cascading effects
- Teaches nuanced concepts (MCP servers, custom skill creation, CLAUDE.md configuration)

## Quest Chain Rules

- Each quest should unlock access to at least one new area or NPC
- The first quest in a new area should be beginner difficulty
- Advanced quests can reference events from earlier quests ("Remember what Harlan said about preparation?")
- No quest should require completing more than one prerequisite (keep it linear for MVP)

## Quality Checks

Before finalizing:
- [ ] Terminal prompt is solvable purely from in-game information
- [ ] No code terminology in any player-facing text
- [ ] acceptedInputs has 5+ variations
- [ ] wrongResponses are distinct and encouraging
- [ ] Hints progress from vague to specific
- [ ] Heal moment has visual, audio, and NPC reaction components
- [ ] Quest unlocks forward progression (new area or NPC)
- [ ] _creatorNote clearly explains the Claude Code concept
- [ ] All dialogue matches the NPC's established speech pattern
- [ ] JSON is valid and matches the schema
