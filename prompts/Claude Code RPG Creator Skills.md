# Claude Code RPG – Creator Skills

## tl;dr

Claude Code RPG is a cozy, pixel-art learning RPG that teaches software concepts by immersing players in a fourth-wall-bending, glitched world. NPCs, quests, and heal moments are generated using meta Claude Code skill files—structured creation prompts—for consistent, on-brand content production. The system empowers creators to rapidly expand the game with new storylines, characters, and areas while preserving the "cozy but broken Stardew Valley" feel and strictly avoiding real-world code jargon in in-world content.

## Goals

### Business Goals

* **Ship a playable MVP**: Deliver a fully playable web MVP with at least 1 village, 3 NPCs, and 3 quests within 12 weeks.

* **Reduce content creation friction**: Achieve <1 hour from spec to playable quest/NPC for internal creators by using skill-based content generation.

* **Retention**: Reach >35% D7 retention among playtesters by blending engaging narrative, rewarding gameplay, and effective “hidden learning.”

* **Community expansion**: Provide contributors with documented, repeatable tools for generating high-quality game content.

### User Goals

* **Exploration & Discovery**: Players enjoy exploring a beautiful, glitchy world and uncovering secrets at their own pace.

* **Emotional Progression**: The “heal” moments feel genuinely earned and satisfying, rewarding curiosity and problem-solving.

* **Passive Learning**: Players internalize software/Claude Code concepts effortlessly, without feeling like they’re in a tutorial.

* **Companionship & Connection**: NPCs are memorable, weird, and lovable—players want to help them.

* **Sense of Impact**: Fixing glitches has real, visible effects on the world—players feel like they’re making a difference.

### Non-Goals

* **Real-code Execution**: The MVP does not run actual Claude Code or sync with a live Claude instance; everything is simulated in-world.

* **Complex Combat Systems**: No enemy battles, stats, or health bars—gameplay revolves around quests and world interactions, not violence.

* **Open-ended Modding**: While future community content is possible, the MVP will not launch with user-level scripting or direct asset imports.

## User Stories

### Persona: Game Creator / World Designer

* As a **creator**, I want to generate a new NPC with a few clicks and minimal input, so that I can rapidly populate new village areas.

* As a **creator**, I want to design quests that teach deep concepts in a hidden, narrative-first way, so that players learn through story, not instruction.

* As a **creator**, I want a clear workflow for NPCs → quests → heal moments, so that each new world addition feels coherent and high-quality.

* As a **creator**, I want to keep the brand voice and tone consistent, so that the world always feels weird, cozy, and slightly broken.

### Persona: Player (Developer, Age 18-40)

* As a **player**, I want to meet quirky villagers and help them, so that I feel invested in the story.

* As a **player**, I want to solve riddles and mysteries, so that I’m challenged but never blocked or punished.

* As a **player**, I want visible world changes after solving quests, so that my actions feel meaningful.

* As a **player**, I want to uncover secrets about the world (and my place in it), so that exploration feels rewarding.

### Persona: External Collaborator

* As a **collaborator**, I want skill templates and examples for content creation, so that I can contribute without breaking the game’s aesthetic.

## Functional Requirements

* **NPC System (P0)**

  * **NPC Generator**: Tool that uses the generate-npc skill to create villagers with schema, personality, glitch symptom, and dialogue.

  * **NPC Dialogue**: In-game dialogue interface supporting multi-line, branching dialog per NPC.

* **Quest System (P0)**

  * **Quest Generator**: Tool that uses the generate-quest skill for new quests tied to existing NPCs; outputs schema, dialogue, terminal riddle, and heal linkage.

  * **Terminal Simulation**: In-world interface for solving metaphorical “riddles”—simulates Claude Code terminal with custom prompt and playful error messaging.

* **World & Area System (P1)**

  * **Area Generator**: Skill-based generation of explorable areas, including palette, glitch theme, NPC roles, and unlock logic.

  * **World Map**: Basic navigation between 1–3 areas and corresponding quest/NPC logic.

* **Heal Moment System (P0)**

  * **Heal Generator**: Uses the generate-heal-moment skill to write and script the vivid payoff moments for completed quests, including audio/visual cues.

* **Meta Content Workflow (P0)**

  * **Skill File Management**: Support for dropping .md skill files in a /.claude/skills/ directory and instantiating them via simple inputs.

  * **Preview/Playtest Mode**: Lets creators instantly preview NPC, quest, heal moment output in-game.

* **Brand Consistency Enforcement (P1)**

  * **No Jargon Filter**: Ensures that in-world text never leaks real coding terms; creator notes are always private.

  * **Asset/Palette Controls**: Enforces area and NPC visual guidelines for coherent art direction.

## User Experience

**Entry Point & First-Time Experience**

* Users land on a pixel-art main menu with lo-fi, slightly glitched music and the promise of a cozy adventure gone slightly wrong.

* First launch triggers an intro cutscene: the developer is transported into the “normal” world, but the opening is disrupted by a noticeable glitch.

* Players get gentle, diegetic onboarding—an NPC welcomes them, the first sample quest triggers without explicit “tutorial” UI.

**Core Experience**

* **Step 1**: Player walks freely in the world using arrow/WASD, discovers glitched NPC.

* **Step 2**: Initiates conversation with NPC (dialogue appears in stylized, letterbox window with branching options reflecting confusion/quirk).

* **Step 3**: NPC offers a quest—dialogue includes subtle hint at the in-world riddle (not explicit instructions).

* **Step 4**: Terminal interface slides in, stylized as an old magic tome or “debug console”; player types, solves the riddle (simulated parser).

* **Step 5**: On successful input, world transitions: colors restore, sound sharpens, NPC thanks player sincerely.

* **Step 6**: World changes persist (tiles, ambient noise, new path), opening up further exploration.

**Edge Cases**

* **Error States**: If the player enters a wrong command in the terminal, the system responds with friendly encouragement and inline hints—never punishment.

* **Empty States**: If no quests or NPCs are nearby, unique idle dialogue and ambient glitched animations fill space.

* **Loading States**: Transitions between world areas and “healed” scenes use playful glitch dissolve/restore animations.

* **Content Dead Ends**: If a world area is completed or locked, offer diegetic hints or curiosities instead of hard “no” messages.

## Narrative

A developer, tired after a long night of coding, falls asleep only to wake up inside a bright, pixelated village. At first, everything seems charming: the grass sways, a dog barks, villagers wave hello. Yet oddities creep in—a villager repeats the same greeting, shadows flicker at the edge of the screen, music loops off-key. The blacksmith, eyes worryingly glassy, can’t remember how to forge anything. NPCs whisper about the “glitch sickness”—but none truly understand it. The player alone sees the seams.

Drawn to help, the player speaks to villagers, hears their stories, and investigates odd phenomena. Each interaction is part story, part puzzle: a cryptic riddle to fix what's broken underneath. Succeed, and the transformation is palpable—a burst of color, the world’s music resolves, the grateful NPC says something genuine for the first time. With every repaired glitch, deeper mysteries surface: what caused the corruption? How do you escape—a developer in a world that shouldn’t be? The journey continues, one healed heart at a time.

## Success Metrics

### User Metrics

* **Daily Active Users (DAU)** for prototype: Target 500+ unique players in first beta.

* **Quest Completion Rate**: >70% of players finish at least 2 quests per session.

* **Net Promoter Score (NPS):** >50 among test users for “would recommend to a friend.”

### Business Metrics

* **Time to Ship**: MVP world live within 12 weeks; average content creation time <1hr per asset.

* **Unique Quests Generated**: Repeatable world expansion—at least 15 distinct quests in first 90 days.

* **Beta Mailing List Signups**: At least 2,000 in prelaunch.

### Technical Metrics

* **Load Time**: <3 sec to interactive for main world scene.

* **Uptime**: >99% service uptime during core beta.

* **Jargon Leakage Rate**: <1% of in-world text includes forbidden code terms.

### Key Events to Track

* NPC dialogue viewed

* Quest accepted/completed

* Terminal opened/solved/failed

* Heal moment triggered

* Area unlocked/entered

* Creator-generated content instantiated

## Technical Considerations

* **All game logic and content simulation is handled in-browser.** There is no need for live Claude Code execution or code sandboxing.

* **.md skill files are hot-loaded in a local /skills/ folder,** allowing instant iteration for creators and minimizing deployment friction.

* **All in-game text that references Claude Code concepts via symptom or metaphor** must be presented in-world as world logic—strict separation of meta “creator notes” and player-facing text.

* **World state and quest logic are persisted per user session.** Extensible state layer to support future multi-user expansions.

* **Performance critical:** snappy pixel art rendering, zero-jank transitions, no lengthy blocking operations on file load/content gen.

## UI Architecture

* **Framework:** React (Vite or Next.js for dev speed and SPA/SSR flexibility)

* **Component Library:** shadcn/ui or custom lightweight pixel-art components; game screen, terminal, dialogue windows, and modals are custom.

* **Styling:** Tailwind CSS for utility-first styling with custom classes for pixel grid, CRT effect shaders, and color overlays.

* **State Management:** Zustand for local, fast state (quest, NPC, map, dialogue), possibly React Context for top-level user/session.

* **Animations:** Framer Motion for UI transitions; CSS pixel art-safe keyframes for sprite/scene transitions.

* **Responsive Design:** Fixed pixel grid “game window” (800x600 or similar) with letterboxing; scales up on desktop, supports touch controls for mobile/tablets.

* **Accessibility:** Keyboard navigation, readable fonts by default, ARIA labels on all interactive elements; WCAG AA for color contrast.

## API & Backend

* **Framework:** Next.js API routes or Express as a fallback (used mainly for user save, event tracking, skills catalog).

* **Database:** Supabase (Postgres) for user sessions, save games, content tracking; Prisma ORM for schema safety.

* **Authentication:** Supabase Auth (GitHub/email magic link for playtesters).

* **Hosting:** Vercel (Next.js) or Railway (Express/Supabase).

* **Key API endpoints:**

  * **/api/user-save**: Save/load player world state and quest progress.

  * **/api/npc-skill**: Preview/generate NPCs from local skills.

  * **/api/quest-skill**: Preview/generate quests from skills directory.

  * **/api/heal-skill**: Generate/preview heal moments.

  * **/api/area-skill**: Generate/preview new areas.

  * **/api/analytics**: Log key gameplay events for metrics.

## Performance & Scalability

* **Optimizations:** Static asset bundling, sprite sheets, lazy-load for offscreen areas, in-memory cache for .md skill loads; SSR for main entry screen.

* **Accessibility:** WCAG AA minimum, readable font sizes, all-blue palette variants for colorblind support.

* **Scalability:** Designed for tens of thousands of DAUs on launch; Supabase/Postgres can scale, CDN for asset delivery.

* **Monitoring:** Sentry for JS errors, Vercel/Cloudflare for uptime, custom logging hooks for in-game events and content errors.

## Integration Points

* **Audio**: Howler.js for music/SFX, supports layering ambient with event cues.

* **Pixel Art**: Asset pipeline for TinyPilot/Nickerson palettes, custom sprite sheets.

* **Analytics**: Posthog or Amplitude for gameplay event tracking and creator usage.

* **No payment/email for MVP**—user accounts for saves only.

* **AI/Prompt Integration**: Local Claude/Anthropic API for skill-driven content generation (for in-development/testing, not core runtime).

---

# Content Creation System: Claude Code Skills

---

## Overview

All core content (NPCs, quests, heal moments, areas) is generated using specialized Claude Code skill files (.md with YAML frontmatter) placed in the `.claude/skills/` directory. Each skill is purpose-built for a single content type and provides a tightly-scoped template, ensuring all generated assets embody the game's tone, schema, and teaching philosophy.

**Workflow for creators:**

1. Run `generate-npc` to create a new character.

2. Run `generate-quest` to tie a quest to that NPC.

3. Run `generate-heal-moment` to script the reward/payoff.

4. (Optionally) Use `generate-world-area` when expanding the map.

> **Golden Rule**: In-world content must *never* reference real code or dev terminology. Lessons are woven into narrative and metaphor—never surface. \[CREATOR NOTE\] blocks are strictly private for authors/maintainers only.

---

## Skill: generate-npc

---

## name: generate-npc description: Generates a fully realized NPC for Claude Code RPG — complete with personality, glitch symptom, dialogue style, and the Claude Code concept their arc teaches. Use when creating new village characters.

When generating an NPC, always include:

1. **Output the NPC schema table with fields:**

  * Name

  * Role

  * Glitch Symptom (describe their "sickness" or what seems off)

  * Dialogue Style (how they speak; quirks, pacing, affect)

  * Knowledge Domain (what topics or world lore they are drawn to)

  * Catchphrase (one-liner they use repeatedly)

2. **Introductory Dialogue**  

  Write 3 lines of dialogue in the NPC’s voice.

  * Tone: warm, slightly confused, fourth-wall adjacent (they hint something is wrong, but never name it)

  * Rule: **No code terminology. Keep everything metaphorical or slice-of-life strange.**

3. **Visual Description (Pixel Art Terms)**

  * Palette used (colors, mood)

  * Sprite: size, hair/hats, clothing, props

  * Animation or idle pose details

  * Any glitched visual traits (flickers, misplaced pixels, etc.)

4. **Claude Code Concept**

  * State the Claude Code principle this NPC’s arc is based on, but **only in a PRIVATE** `[CREATOR NOTE]` **block**. Never surface to the player.

5. **Tone Rules**

  * No coding jargon or references in any dialogue.

  * Symptom must reflect the underlying lesson, but metaphorically.

  * NPCs should evoke Stardew Valley villagers—kind, kind of odd, just off enough to be memorable.

---

## Skill: generate-quest

---

## name: generate-quest description: Generates a complete quest for Claude Code RPG, mapping a world glitch to a hidden Claude Code lesson through narrative, NPC dialogue, and a terminal challenge. Use when designing a new quest for an existing NPC.

When generating a quest, always include:

1. **Output the full quest schema:**

  * Title

  * Related NPC

  * Glitch Description (from the in-world NPC/POV; never break 4th wall overtly)

  * Lesson Hidden Inside (**creator note only; strictly private**)

  * Terminal Challenge (the “command” or riddle the player must enter; must be a STRONG metaphor, never a real code snippet)

  * Success State (what changes in the world if player solves it)

  * Heal Moment (1-2 vivid sentences describing the core payoff: sight/sound/feel)

2. **Quest-giving Dialogue**  

  Write 4–6 lines delivered by the NPC, in character.

  * Emotion: warm, grateful, slightly off or desperate

  * Sneak a hint to the riddle inside dialogue—don’t give away solution

3. **Terminal Wrong-Input Responses**

  * Write 2 playful, motivating wrong-input messages from the quest terminal; nudge the player, never scold or punish.

4. **NPC Post-Heal Thank-You Dialogue**

  * Write 2–3 lines—personality restored, more clarity or warmth than before.

5. **Design Rules**

  * Terminal challenge must be solvable from context/hint, not outside knowledge.

  * Never surface lesson text in public (player) content; keep all direct teaching in `[CREATOR NOTE]` only.

  * All success/heal moments must feel emotional—earned, not mechanical.

---

## Skill: generate-heal-moment

---

## name: generate-heal-moment description: Writes the full sensory and narrative description of a world heal moment for Claude Code RPG — the emotional and visual payoff when a quest is completed. Use after a quest is designed to script the exact heal sequence.

When scripting a heal moment, always include:

1. **Visual Sequence**

  * Describe in pixel art/sprite terms:

    * What do corrupted tiles do (flicker, shatter, fade, etc.)?

    * How does color return to the world?

    * What do key NPC sprites do (expression, animation)?

2. **Audio Sequence**

  * What does the glitchy sound do? (buzz, distortion)

  * How does it resolve? (chime, warm melody)

  * Any ambient sounds or music cues?

3. **NPC In-the-Moment Reaction**

  * Write 1–2 lines said immediately after healing; a sincere, surprised, relieved tone from the NPC.

4. **Persistent World Change**

  * Describe any change that remains post-heal:

    * Tiles fixed/unlocked

    * New area/path opened

    * Restored details or scenery

5. **Rules**

  * Scene must read like a small “cinematic moment”: vivid with sensory detail, emotional before didactic resolution.

  * No dialogue or narration should reference code, files, or dev terms.

---

## Skill: generate-world-area

---

## name: generate-world-area description: Generates a new explorable area for Claude Code RPG — with a defined visual identity, glitch theme, resident NPCs, and the Claude Code concept domain it teaches. Use when expanding the world map.

When generating a new area/region, always include:

1. **Output the area schema:**

  * Area Name

  * Visual Palette (describe normal/“healthy” state colors plus glitched variant)

  * Ambient Sound Description (music, environmental, glitched overlays)

  * Glitch Theme (e.g., looping, stutter, forgotten, fragmented)

  * Claude Code Domain (creator note only; don’t surface to player)

  * Number of NPCs slated for area

  * Unlock Condition

2. **Player Perspective Description**  

  Write 3–4 sentences as if you’re the player entering the area for the first time:

  * What do you see/hear/feel?

  * What seems wrong or glitched?

  * What, if anything, feels cozy or inviting?

3. **NPC Role Suggestions**

  * List 2–3 plausible NPC roles/titles that fit the area vibe—to be fleshed out using generate-npc.

4. **Healed State Description**

  * What changes, both visually and aurally, when all area quests are complete and the area is restored?

5. **Design Rules**

  * Each area’s glitch/sickness must be coherent and thematic (not just mixed bugs).

  * Healed state should feel transformative.

  * Every area must have a visual and emotional identity—palette, music, NPCs work together for a unique tone.

---