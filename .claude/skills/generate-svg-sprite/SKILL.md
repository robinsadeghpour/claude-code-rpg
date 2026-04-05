---
name: generate-svg-sprite
description: "Generates SVG pixel art sprites, tiles, and visual assets for Claude Code RPG. Use this skill whenever the game needs a new character sprite, tile, item, portrait, UI element, or any visual asset. Outputs clean SVG files using a pixel grid approach — each 'pixel' is a small rect on a grid. Always consult brand-and-tone for palette and style constraints. This skill replaces the need for external image generation tools for MVP — Claude Code creates all visual assets directly as SVG."
---

# Generate SVG Sprite — Claude Code RPG

Creates pixel art assets as SVG files using a grid-of-rectangles approach. Each "pixel" is a colored `<rect>` element on a defined grid. This produces clean, scalable, palette-consistent pixel art without needing any external image generation.

Before generating, read `brand-and-tone` for the exact color palettes and pixel art specifications.

## Why SVG Pixel Art

- Claude Code can generate SVGs directly — no API calls, no external tools
- SVGs scale perfectly with `image-rendering: pixelated`
- Colors are exact hex values from the brand palette
- Files are small, load fast, and are easy to edit
- Consistent style across all assets (no generation variance)

## Core Technique

Every sprite is built on a grid. Each cell in the grid is one "pixel" rendered as an SVG `<rect>`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 32" shape-rendering="crispEdges">
  <!-- Each rect is 1x1 unit = one pixel -->
  <rect x="7" y="0" width="1" height="1" fill="#C67B5C"/>  <!-- skin -->
  <rect x="8" y="0" width="1" height="1" fill="#C67B5C"/>  <!-- skin -->
  <!-- ... hundreds more rects to form the sprite -->
</svg>
```

Key SVG attributes:
- `shape-rendering="crispEdges"` — prevents anti-aliasing, keeps pixels sharp
- `viewBox="0 0 {width} {height}"` — defines the pixel grid size
- No `stroke` on rects — pure filled pixels
- Group related parts with `<g>` tags for organization

## Asset Types and Sizes

### Character Sprites (16x32)
- ViewBox: `0 0 16 32`
- Top half: head (large, expressive, ~10px tall)
- Bottom half: body (smaller proportions, Stardew-style)
- Arms at sides or holding props
- 1px dark outline on character, no outline on individual body parts
- Generate three variants: idle, glitched, healed

### Tiles (16x16)
- ViewBox: `0 0 16 16`
- Seamless edges — tiles placed next to each other should look continuous
- Types: grass, path, water, building walls, floor, special objects
- Generate healthy and glitched variants for tiles in affected areas

### Item Sprites (16x16)
- ViewBox: `0 0 16 16`
- Centered in the frame with 1-2px padding
- Clear silhouette — readable at small size
- Items: tools, quest objects, interactables

### NPC Portraits (32x32)
- ViewBox: `0 0 32 32`
- Face close-up for dialogue box display
- More detail than the game sprite — expressive eyes, visible emotion
- Generate: neutral, worried/glitched, happy/healed expressions

### UI Elements (variable size)
- Dialogue box borders, button frames, terminal decorations
- Use the brand palette neutrals
- 9-slice compatible where possible (corners + edges + fill)

## Color Palette Reference

Pull directly from brand-and-tone. Quick reference:

```
HEALTHY:
  skin-light:    #C67B5C
  skin-dark:     #8B6549
  cream:         #FFF8E7
  sage:          #C5D5A5
  peach:         #FFB088
  lavender:      #C4A8D8
  mint:          #88D4B0
  sunbeam:       #FFE066
  charcoal:      #3A3A3A
  warm-gray:     #7A7A7A

GLITCHED:
  corrupt-cyan:  #00FFD4
  corrupt-magenta: #FF00FF
  electric-purple: #9B30FF
  error-red:     #FF3355
```

Sprites should use 6-10 colors max. Pick a subset from the palette that fits the character/tile. Every color in the sprite must come from this palette — no off-palette colors.

## Generation Process

### Step 1: Plan the Sprite
Before writing SVG, sketch the layout mentally:
- What is the subject?
- What colors from the palette?
- What's the key readable feature? (blacksmith's hammer, librarian's glasses, baker's hat)
- What makes the glitched version look "off"?

### Step 2: Build Row by Row
Generate the SVG by working top-to-bottom, left-to-right. For a 16x32 character:
- Rows 0-2: hair/hat top
- Rows 3-6: face (eyes at row 4-5 are critical for expression)
- Rows 7-9: hair sides, ears
- Rows 10-12: neck, shoulders
- Rows 13-20: torso, arms, props
- Rows 21-27: legs
- Rows 28-31: feet, ground shadow

### Step 3: Add Outline
Add a 1px dark charcoal (#3A3A3A) outline around the full character silhouette. Don't outline internal details — just the outer edge.

### Step 4: Create Variants

**Glitched variant**: Take the idle sprite and apply these modifications:
- Shift 2-4 rows of pixels horizontally by 1-2px (like a transmission glitch)
- Replace 10-15% of colors with corrupt-cyan or corrupt-magenta
- Optional: duplicate a section (like the head) offset by 1px in a glitch color at 50% opacity

**Healed variant**: Take the idle sprite and:
- Keep the same pose but slightly more relaxed (adjust 1-2 pixels in posture)
- Add a subtle warm glow: 1px sunbeam-yellow pixels around the edges (sparse, not a full outline)
- Brighten 1-2 accent colors slightly

## SVG Organization

Structure the SVG with named groups:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 32" shape-rendering="crispEdges">
  <g id="outline">
    <!-- Dark outline rects -->
  </g>
  <g id="body">
    <!-- Torso, arms, legs -->
  </g>
  <g id="head">
    <!-- Hair, face, expression -->
  </g>
  <g id="props">
    <!-- Held items, accessories -->
  </g>
  <g id="shadow">
    <!-- Ground shadow (2-3 dark pixels under feet) -->
  </g>
</svg>
```

## File Output

Save sprites to `public/assets/sprites/`:
- `sprite-{name}-idle.svg`
- `sprite-{name}-glitched.svg`
- `sprite-{name}-healed.svg`

Save tiles to `public/assets/tiles/`:
- `tile-{area}-{type}.svg`
- `tile-{area}-{type}-glitched.svg`

Save portraits to `public/assets/sprites/`:
- `portrait-{name}-neutral.svg`
- `portrait-{name}-worried.svg`
- `portrait-{name}-happy.svg`

## Rendering in the Game Engine

SVGs are loaded as regular images with nearest-neighbor scaling (Kaplay's `pixelArt: true`). No special SVG handling needed.

## Animated Character Sprite Sheets (CRITICAL)

The game engine uses `sliceX: 4, sliceY: 4` to cut sprite sheets into a 4x4 grid, then `from/to` sequential frame ranges for animations. This means the sprite sheet layout MUST follow this exact structure:

```
┌─────────┬─────────┬─────────┬─────────┐
│ Row 0   │ down    │ down    │ down    │ down    │  ← frames 0-3: walk-down
│         │ idle    │ step-L  │ idle-v  │ step-R  │
├─────────┼─────────┼─────────┼─────────┤
│ Row 1   │ up      │ up      │ up      │ up      │  ← frames 4-7: walk-up
│         │ idle    │ step-L  │ idle-v  │ step-R  │
├─────────┼─────────┼─────────┼─────────┤
│ Row 2   │ right   │ right   │ right   │ right   │  ← frames 8-11: walk-right
│         │ idle    │ step-L  │ idle-v  │ step-R  │
├─────────┼─────────┼─────────┼─────────┤
│ Row 3   │ left    │ left    │ left    │ left    │  ← frames 12-15: walk-left
│         │ idle    │ step-L  │ idle-v  │ step-R  │
└─────────┴─────────┴─────────┴─────────┘
```

### Rules (violations cause the "rotating character" bug):

1. **Every frame in a row MUST face the SAME direction.** Never put a front-facing frame in a side-facing row. This is the #1 cause of broken walk animations.
2. **4 walk-cycle frames per direction:** idle → step (left foot) → idle variant → step (right foot)
3. **Frame 0 of each row = idle frame** for that direction (used when standing still)
4. **Left-facing row = horizontally flipped right-facing row.** Generate right (row 2), then mirror for left (row 3).
5. **All 4 directions need distinct sprites:** down (front-facing, face visible), up (back-facing, back of head), right (profile, hair/face to the right), left (profile, hair/face to the left)

### Walk Cycle Per Row

Each row must show a natural walk cycle that loops cleanly:

```
Frame 0: Standing idle (neutral pose, both feet on ground)
Frame 1: Mid-stride left foot forward (lean left, left leg extended)
Frame 2: Standing idle variant (similar to frame 0, slight variation for natural feel)
Frame 3: Mid-stride right foot forward (lean right, right leg extended)
```

### Common Mistakes to Avoid

- ❌ Putting front/side/back frames in the same row (causes rotation)
- ❌ Only generating 1-2 side-facing frames and filling the rest with front-facing (causes rotation)
- ❌ Mixing idle and walk frames from different directions
- ❌ Forgetting to generate side profiles (left/right) — all 4 directions are required
- ❌ Swapping left/right rows (right profile goes in row 2 / frames 8-11, left goes in row 3 / frames 12-15)

### For SVG Sprite Sheets

Generate as a 4x4 grid in a single SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 128" shape-rendering="crispEdges">
  <!-- Row 0: walk-down (y=0-31) -->
  <!-- Frame 0: x=0-15, Frame 1: x=16-31, Frame 2: x=32-47, Frame 3: x=48-63 -->

  <!-- Row 1: walk-up (y=32-63) -->
  <!-- Row 2: walk-right (y=64-95) -->
  <!-- Row 3: walk-left (y=96-127) -->
</svg>
```

### For PNG Sprite Sheets (AI-generated)

AI image generators almost ALWAYS produce broken sprite sheets with mixed directions. Expect this and plan for rearrangement.

**Known AI generation failures (from real experience):**
- AI puts front-facing and back-facing frames in the same row (e.g., row 0 has 2 down + 2 up)
- AI generates very few true side-profile frames (often only 1-2 out of 16)
- AI fills side-facing rows with front/back frames instead of profiles
- The idle frame for side rows is often a front-facing frame, not a true profile

**Mandatory verification and fix procedure:**

1. **Extract all 16 frames** using Python/Pillow before using the sheet:
   ```python
   from PIL import Image
   img = Image.open("sprite-sheet.png").convert("RGBA")
   fw, fh = img.width // 4, img.height // 4
   for row in range(4):
       for col in range(4):
           frame = img.crop((col*fw, row*fh, (col+1)*fw, (row+1)*fh))
           frame.save(f"frame-r{row}c{col}.png")
   ```

2. **Visually inspect EVERY frame** — read each extracted PNG and classify:
   - DOWN: face visible, eyes visible, body symmetrical
   - UP: back of head, lots of hair, no face features
   - RIGHT: profile facing right, body turned right
   - LEFT: profile facing left, body turned left

3. **Rearrange into correct rows** using Pillow:
   - Gather all DOWN frames → Row 0
   - Gather all UP frames → Row 1
   - For RIGHT: use the true right-profile frame(s). If only 1 exists, repeat it with a 2px vertical offset for walk bounce
   - For LEFT: horizontally flip the RIGHT row
   - **CRITICAL**: If a frame faces the wrong direction, do NOT put it in that row. A repeated correct frame is better than a mixed-direction row.

4. **Save and verify in-game** with playwright (see Verification section below)

**NEVER skip frame extraction.** Even if the sheet "looks correct" at a glance, individual frames often face the wrong direction.

## Tile / Overlay Sprite Rules (CRITICAL)

Detail overlay tiles (flowers, mushrooms, grass tufts, etc.) are placed on top of the grass terrain at z=1 with partial opacity. They MUST follow these rules:

1. **Transparent background is MANDATORY.** Any opaque background pixels will show as ugly colored squares on the grass. This is the #1 tile visual bug.
2. **Verify transparency** after creation:
   ```python
   from PIL import Image
   import numpy as np
   img = Image.open("tile.png").convert("RGBA")
   data = np.array(img)
   bg_ratio = (data[:,:,3] == 0).sum() / (data.shape[0] * data.shape[1])
   assert bg_ratio > 0.50, f"Tile is {100-bg_ratio*100:.0f}% opaque — likely has a background!"
   ```
3. **SVG tiles are naturally transparent** (no background rect = transparent). But if converting SVG → PNG (e.g., for scale compatibility), ensure the PNG preserves the alpha channel.
4. **AI-generated tile PNGs** almost always have opaque backgrounds (white, brown, green). NEVER use them directly. Either:
   - Regenerate as SVG (preferred)
   - Or use flood-fill from corners to remove the background, then verify

### NEVER Modify Original Image Files In-Place

When fixing or processing any image asset:
1. **Always copy first**: `cp original.png original-backup.png`
2. Work on the copy, not the original
3. Untracked files (not in git) cannot be recovered if destroyed
4. This applies to ALL image manipulation: background removal, frame rearrangement, color correction, etc.

## Verification with Playwright (MANDATORY)

After creating or modifying ANY visual asset, verify in-game using playwright-cli:

```bash
# 1. Reload the game
playwright-cli run-code "async page => {
  await page.evaluate(() => localStorage.removeItem('claude-code-rpg-save'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('canvas').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
}"

# 2. Screenshot and visually inspect
playwright-cli screenshot --filename=verify-asset.png

# 3. For character sprites — walk in all 4 directions
# Hold each direction for 400ms, screenshot, then release and try next

# 4. For tiles — navigate to areas where tiles appear
# Check for visible background squares or artifacts
```

**What to check:**
- No colored rectangles/squares around sprites (= opaque background)
- Character faces the correct direction when walking
- No "rotation" effect during walk animations
- Tiles blend naturally with terrain (no hard edges)
- Player is visible at spawn position
- No console errors related to asset loading

## Quality Checks

Before finalizing:
- [ ] All colors are from the brand palette (no off-palette colors)
- [ ] `shape-rendering="crispEdges"` is set on the SVG root
- [ ] ViewBox dimensions match the asset type spec
- [ ] No anti-aliasing artifacts (no fractional coordinates, all values are integers)
- [ ] Character has a clear silhouette readable at 48px wide (3x scale)
- [ ] Glitched variant is noticeably different but still recognizable
- [ ] File naming follows the convention in brand-and-tone
- [ ] SVG groups are organized and named
- [ ] Total pixel count is reasonable (no stray pixels outside the intended shape)

**Additional checks for animated sprite sheets:**
- [ ] Row 0 has ONLY down-facing frames (face visible, front of body)
- [ ] Row 1 has ONLY up-facing frames (back of head, back of body)
- [ ] Row 2 has ONLY right-facing frames (right profile) — frames 8-11
- [ ] Row 3 has ONLY left-facing frames (left profile, mirrored right) — frames 12-15
- [ ] No direction mixing within any row (the #1 bug source)
- [ ] Walk cycle in each row: idle → step → idle-variant → step-variant

## Example: Minimal Character (8x16 simplified demo)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 16" shape-rendering="crispEdges">
  <!-- Hair -->
  <rect x="2" y="0" width="4" height="1" fill="#8B6549"/>
  <rect x="1" y="1" width="6" height="1" fill="#8B6549"/>
  <!-- Face -->
  <rect x="1" y="2" width="6" height="1" fill="#C67B5C"/>
  <rect x="1" y="3" width="6" height="1" fill="#C67B5C"/>
  <!-- Eyes -->
  <rect x="2" y="3" width="1" height="1" fill="#3A3A3A"/>
  <rect x="5" y="3" width="1" height="1" fill="#3A3A3A"/>
  <!-- Body -->
  <rect x="2" y="5" width="4" height="1" fill="#FFB088"/>
  <rect x="1" y="6" width="6" height="4" fill="#FFB088"/>
  <!-- Legs -->
  <rect x="2" y="10" width="2" height="4" fill="#3A3A3A"/>
  <rect x="4" y="10" width="2" height="4" fill="#3A3A3A"/>
  <!-- Feet -->
  <rect x="1" y="14" width="3" height="1" fill="#8B6549"/>
  <rect x="4" y="14" width="3" height="1" fill="#8B6549"/>
</svg>
```

This is intentionally simplified. Real 16x32 sprites will have much more detail — this just shows the technique.
