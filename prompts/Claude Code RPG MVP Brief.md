
# Claude Code RPG – MVP Product Brief

## tl;dr

Claude Code RPG is a browser-based 2D RPG where a developer is mysteriously pulled into a bug-ridden, Stardew Valley-style village and must use Claude Code concepts to debug and heal the world. Instead of dry documentation, users learn core Claude Code ideas organically through puzzling quests, NPCs, and a magical simulated terminal. Targeted at developers curious about or new to Claude Code, the game’s meta-system allows for easily generated quests and characters.

## Goals

### Business Goals

* Drive 10,000 developers to actively try Claude Code RPG within the first 60 days post-launch

* Achieve a 35% social share rate from “healed moment” or quest completion screen

* Enable the community to design 50+ custom quests/NPCs in the first 3 months

* Foster lasting Claude Code concept adoption, measured by a 25% increase in Claude Code search traffic

### User Goals

* Learn Claude Code principles by context—solving riddles, not rote tutorials

* Feel satisfied and curious as they “heal” glitched parts of the world

* Experience a cohesive and cozy world reminiscent of Stardew Valley

* Feel compelled to share their progress and moments with others

* Develop confidence to try real Claude Code projects

### Non-Goals

* No live Claude Code interpreter or real backend integration for MVP

* No multiplayer or social world features at MVP

* No fixed quest content—all core quests/NPCs are generated via internal meta systems

## User Stories

**Persona 1: The Curious Developer**  

Already knows of Claude Code, but has only used it passively or in demos.

* As a Curious Developer, I want to explore a pixel world, so that I can feel at home in a familiar-but-strange environment.

* As a Curious Developer, I want to realize the world is glitched, so that my curiosity is piqued to learn why.

* As a Curious Developer, I want to talk to offbeat NPCs who request my help, so that I feel pulled into action.

* As a Curious Developer, I want to use a simulated terminal to “debug” the world, so that learning feels tangible and narrative-driven.

* As a Curious Developer, I want to share my “healed zone” moments, so that I can show off my progress to peers.

**Persona 2: The New Developer**  

Recently heard about Claude Code—curious but skeptical.

* As a New Developer, I want a gentle onboarding, so that I never feel lost in technical jargon.

* As a New Developer, I want hints and playful nudges from the world, so that puzzles never feel impossible.

* As a New Developer, I want each quest to gradually reveal more of the world’s backstory—and Claude Code’s concepts—so that learning feels natural.

* As a New Developer, I want to revisit places I healed, so that I feel a sense of mastery and progress.

* As a New Developer, I want to continue playing or start over, so that I can reinforce what I learned or try different paths.

## Functional Requirements

* **World & Navigation (P0)**

  * 2D Pixel Art World: Classic top-down map with defined regions and cozy visuals.

  * Walking/Exploration: Player can freely move around using keyboard/controller.

* **Interaction (P0)**

  * NPC Interaction System: Click/talk to NPCs with dialogue triggers.

  * Glitch/Heal Visual States: Certain world areas/NPCs visually corrupted until “healed.”

* **Learning Gameplay (P0)**

  * Simulated Claude Code Terminal UI: In-world terminal appears for puzzles/riddles.

  * Quest Trigger and Completion: Receive, track, and complete quests via dialogue/terminal.

* **Immersion (P1)**

  * NPC Dialogue Trees: Branching dialogue with distinct personalities.

  * Quest Journal/Tracker: Lightweight quest log accessible from main UI.

  * Ambient Sound System: Contextual lo-fi soundscapes, dynamic music.

* **Meta/Replay (P2)**

  * World Map: Mini-map showing explored and healed regions.

  * Progress Persistence: Local save to resume at later time.

  * Shareable Moments: "You healed the Blacksmith's Forge!" share screens/gifs.

## User Experience

### Landing Page & First-Time Experience

* **Parallax Scene:** The landing page fills the entire browser viewport and is constructed with 10+ stacked `<div>` layers. Each layer scrolls at a different speed for a multi-depth parallax effect, directly inspired by Stardew Valley’s start screen.

  * **Back to Front Layers:**

    1. Static sky gradient (warm peach/lavender) as the deepest background.

    2. Far clouds, drifting left-to-right at a very slow parallax.

    3. Near clouds, moving slightly faster.

    4. Distant village and hill silhouettes at mid speed.

    5. Foreground trees and grass, moving fastest as user scrolls or as the scene idly animates.

    6. Animated bird sprite looping gently in the foreground.

    7. Additional foreground details (rocks, fence posts, reeds). 8+. Optional: subtle atmospheric overlays (sunbeams, shifting light).

  * **All assets rendered as CSS background images or lightweight PNGs (not video), mirrored after Stardew Valley’s approach.**


* **Glitch Overlay:**  

  Above all parallax layers, an overlay layer triggers a subtle scanline or RGB color-shift flicker at a randomized interval (every 8–12 seconds). This is done using CSS filters and blend modes. The effect is light: just enough to feel an uncanny tension—something is broken beneath the cozy surface—but not so frequent as to distract or annoy.


* **Central Game Logo and CTA:**

  * The Claude Code RPG logo is centered slightly above the vertical midpoint, using a hand-drawn pixel art font fitting the world’s vibe.

  * Directly beneath: a single, large, pixel-art styled button labeled “Enter the Valley.”

  * No navigation, footer, or secondary UI—pure immersion and focus on world + single action.


* **Transition On Click:**

  * When the player clicks “Enter the Valley,” a 1-second animation sequence fires: a glitch effect (RGB channel split, quick scanline sweep, brief white flash) overlays the entire screen.

  * The world visually distorts—simulating the player’s “transportation”—then smoothly fades into the in-game environment.

  * No text or explicit narration. The transition itself *is* the story: the player *feels* instantly that they are pulled from a warm world into one with something fundamentally wrong.


* **Performance Target:**

  * All assets optimize for load <3 seconds, using sprite sheets and PNGs.

  * Scene is responsive, supporting desktop and mobile browsers.

### Core Experience

* Step 1: Player walks into a glitched area, with distinct glitch effects (color shifts, NPC looping).

* Step 2: Player interacts with affected NPC; dialogue is slightly off, sometimes looping or scrambled.

* Step 3: NPC reveals a quest, asking for “help with this strange problem.”

* Step 4: Simulated terminal appears—player uses Claude Code-flavored commands/riddles to resolve the issue.

* Step 5: Upon correct entry, a “heal” animation/sequence—glitches resolve, music warms, NPC returns to normal.

* Step 6: Player is thanked and new paths or areas unlock, driving exploration.

### Edge Cases

* Wrong Terminal Input: Terminal returns playful, encouraging error (“Hmm… that spell fizzled. Maybe check your syntax?”).

* Quest Abandonment: Ambiguous quests can be left unfinished; world remains glitched until healed.

* Revisiting Solved Areas: Healed zones update visually/audibly, but do not re-trigger terminal.

* Empty States: If a player wanders with no quest, town’s “brokenness” nudges them back via occasional dialogue or visual cues.

* Loading/Performance Issues: Pixel art preloader and soft fail fallback messages.

## Narrative

Midway through a Claude Code session, the developer’s screen glitches—pixels bloom and swirl until suddenly, they’re standing in a cozy, pastel village. Cottage roofs steam, crows caw, and somewhere, a lo-fi theme wafts. But something is off. The blacksmith mutters the same words over and over. The baker’s bread flickers in and out of existence. An unskippable hint appears in the sky: “Help us, someone messed with the context!”

Wandering, the developer soon meets the Librarian, whose words are scrambled—each attempt at conversation more fragmented. Next to her, a book hovers mid-air, glitching back and forth between open and shut. The Librarian offers a quest: “Find which pattern is looping and set it free.”

Solving the simulated terminal riddle—just a subtle nod to Claude Code’s patterns—the book snaps shut, the Librarian’s sentences resolve, and pastel hues return to normal. The music brightens, birds start singing, and the Librarian thanks the player with a slightly-fuzzy memory of something called “Claude.” For the first time, the player feels they might actually piece this world back together.

## Brand & Design Language

* **Visual Identity:**

  * Warm Stardew-style pixel art as foundation (top-down, rich tilesets, soft rounded sprites)

  * Layered Glitch Aesthetic: Scanlines, color shifting, corrupted sprites/tile swapping in glitched zones

* **Color Palette:**

  * Healthy World: Warm pastels (peach, lavender, mint, sunbeam yellow)

  * Glitched Zones: Desaturated, flickery gradients, purple/cyan-corrupted overlays

* **Typography:**

  * Pixel font for in-world dialogue/UI

  * Monospace terminal font for code areas—feels “otherworldly” when terminal appears

* **Sound Direction:**

  * Lo-fi ambient base, cozy and non-intrusive

  * Glitch SFX (datamosh, static, stutter) layered in broken areas

  * “Resolution chime” on quest complete—signature, warm, uplifting payoff

**The ‘heal’ moment = the emotional and visual payoff:**

* Area flushes with color, animation rewinds/fixes broken tiles, sound resolves, celebratory chime plays.

## Voice & Tone

* **NPCs:**

  * Warm and a bit confused; speak like villagers aware of “something wrong,” but not of their game-ness.

  * Hints at glitches subtly ("My hammer keeps forgetting what it’s supposed to do…"), not blatant.

  * Fourth-wall adjacent, but characters never explicitly reference code or “being coded.”

* **Game Narration:**

  * Dry, witty developer humor; aware of coding tropes but never condescending.

  * Uses playful hints ("Looks like someone left a loop open...again.") vs. strict instructions.

**Tone Words:** curious, warm, slightly glitchy, witty, grounded

**Examples:**

* Good:

  * “Would you mind peeking at my cartwheel? It keeps spinning left… and only left.”

  * “I could’ve sworn these books weren’t humming yesterday.”

* Bad:

  * “Please debug my inventory.py!”

  * “You must call the updateContext() function, hero!”

## Meta System: NPC Creator

**Internal Creator Doc**

*NPC Personality Schema:*

*Rules:*

* NPCs speak in metaphors—never direct coding language.

* Their “symptom” is a narrative parallel to a Claude Code feature or pitfall.

* No overt references to real world coding or tech inside dialogue.

**Example NPC Profile**

## **Claude Skill Template: NPC Generator**

## name: generate-npc

description: Generates an RPG-style NPC with a memorable glitch, warm voice, and an indirect coding lesson for Claude Code RPG.

Always include:

* Name, role, glitch symptom, dialogue quirks, knowledge domain.

* Use metaphors and hint at reality without explicit coding language.

* Write sample introductory dialogue in NPC’s voice.

## Meta System: Quest Creator

**Internal Creator Doc**

*Quest Schema:*

*Rules:*

* Use story/character metaphor to camouflage real coding concepts.

* False leads are playful, never punishing.

* The “heal” moment must feel rewarding—visual, sonic, and emotional.

**Example Quest Outline**

## **Claude Skill Template: Quest Generator**

## name: generate-quest

description: Generates a world quest for Claude Code RPG, mapping a character's world glitch to a coded lesson, and structuring the narrative and playable terminal challenge.

Always include:

* Title, NPC, glitch description, hidden lesson, terminal riddle/challenge, success state, vivid heal moment.

* Write quest from narrative perspective, avoiding explicit code or programming references in dialogue.

## Success Metrics

### User Metrics

* Average session length (target: 15+ min)

* Quest completion rate per user (target: 75%)

* User return rate within 7 days (target: 35%)

### Business Metrics

* Social share/conversion rate from “healed” screens (35%+)

* Waitlist/community signups through in-game prompts (goal: 5,000+)

* Community-created quests/NPCs (goal: 50+ within 3 months)

### Technical Metrics

* Median terminal UI response time (<200ms)

* Game load time on first visit (<3 seconds)

* Rendering FPS on mid-tier machines (60fps)

* Bugs/Critical error rate (<1% session errors)

### Key Events to Track

* world_entered

* npc_talked

* quest_started

* terminal_opened

* terminal_submitted

* quest_completed

* world_healed

* share_initiated

## Technical Considerations

* **Platform:** Browser-only MVP for broad reach and frictionless onboarding.

* **Terminal:** Simulated and narrative—scripted commands tied to meta-system, not real Claude Code.

* **Rendering:** Pixel art rendered via canvas or a lightweight 2D game engine.

* **State:** Fully client-side, local storage for saves/persistence.

* **No backend:** All logic and quests run in-browser; allows instant play.

* **Future Hook:** Electron bridge and real Claude Code CLI for Power User/V2

## UI Architecture

* **Framework:** Next.js or React for UI shell

* **Game Engine:** Phaser.js or Kaplay for 2D tile world

* **Component Library:** Minimal/custom—UI crafted to maintain pixel art vibe, no generic component kit

* **Styling:** Tailwind CSS for overlay UI elements; custom CSS for in-game

* **State:** Zustand for real-time game state

* **Animations:** CSS transitions for UI, frame-based for game canvas; simple tweens for heal moments

* **Responsive:** Fixed aspect 16:9 game canvas, scales for browser window

* **Accessibility:** Keyboard navigable terminal, alt text for UI, color contrast checked for glitched vs normal states

## API & Backend

* **Framework:** None for MVP—fully client-side SPA/PWA

* **Database:** None; optional localStorage for progress

* **Authentication:** None

* **Hosting:** Vercel (static hosting)

* **Key API Endpoints:** N/A for MVP; all quest/terminal data bundled as static assets.

* **Future:** API for persisting progress and user account support; endpoints for community UGC

## Performance & Scalability

* **Optimizations:** Sprite sheets, asset preloading, lazy tile rendering

* **Accessibility:** WCAG AA for overlays/menus; font scaling and ARIA roles

* **Scalability:** Unlimited—static CDN delivers assets; no real server

* **Monitoring:** Lightweight browser error tracking/logging; game event analytics (future: Posthog/Plausible)

## Integration Points

* **MVP:** None; intentionally standalone for control and stability

* **Future:**

  * Claude API for dynamic in-game NPC dialogue or v2 terminal

  * Electron bridge for desktop app/real Claude Code

  * Analytics: Posthog or Plausible for event analytics

  * Community: Webhook or direct API for sharing/ugc/extensions

---

This document defines the system for a meta-driven, cozy RPG that makes learning Claude Code feel magical, comforting, and fun.