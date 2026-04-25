"""Programmatic pixel-art farm sprite — fallback when Nano Banana is unavailable.

Renders a 512x768 transparent PNG: tilled rows of soil with leafy crop sprouts
and a friendly straw scarecrow. Style: cozy pixel-art, top-down 3/4 view.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

W, H = 512, 768
PIXEL = 8  # 8x8 chunky pixels → grid is 64x96

SOIL_DARK = (74, 46, 24, 255)
SOIL_MID = (122, 74, 42, 255)
SOIL_LIGHT = (164, 110, 64, 255)
SOIL_HIGHLIGHT = (196, 142, 92, 255)

LEAF_DARK = (54, 110, 58, 255)
LEAF_MID = (96, 168, 84, 255)
LEAF_LIGHT = (160, 212, 120, 255)

STRAW = (255, 224, 102, 255)
STRAW_MID = (224, 188, 80, 255)
STRAW_DARK = (164, 130, 50, 255)
WOOD = (139, 101, 73, 255)
WOOD_DARK = (90, 64, 44, 255)
HAT_DARK = (70, 48, 36, 255)
HAT_MID = (108, 76, 54, 255)
EYE = (44, 32, 24, 255)
PATCH = (196, 168, 216, 255)
OUTLINE = (44, 28, 18, 255)


def px(draw: ImageDraw.ImageDraw, gx: int, gy: int, color):
    if not (0 <= gx < W // PIXEL and 0 <= gy < H // PIXEL):
        return
    x0, y0 = gx * PIXEL, gy * PIXEL
    draw.rectangle([x0, y0, x0 + PIXEL - 1, y0 + PIXEL - 1], fill=color)


def fill_rect(draw, gx0, gy0, gx1, gy1, color):
    for x in range(gx0, gx1 + 1):
        for y in range(gy0, gy1 + 1):
            px(draw, x, y, color)


def draw_tilled_row(draw, gy_top: int, row_height: int = 6, x0: int = 4, x1: int = 60):
    # soil base
    for y in range(gy_top, gy_top + row_height):
        for x in range(x0, x1):
            base = SOIL_MID
            if y == gy_top:
                base = SOIL_DARK  # back-edge furrow
            elif y == gy_top + row_height - 1:
                base = SOIL_DARK  # front-edge furrow
            elif (x + y) % 7 == 0:
                base = SOIL_LIGHT
            elif (x * 2 + y) % 11 == 0:
                base = SOIL_HIGHLIGHT
            px(draw, x, y, base)
    # outline along front/back for crisper read
    for x in range(x0, x1):
        px(draw, x, gy_top - 1, OUTLINE) if False else None  # keep transparent
    # side caps (thin shadow on left/right edges)
    for y in range(gy_top, gy_top + row_height):
        px(draw, x0, y, SOIL_DARK)
        px(draw, x1 - 1, y, SOIL_DARK)


def draw_sprout(draw, gx: int, gy: int):
    # 3-wide leafy sprout, 3 tall
    # row -2 (top): one light leaf
    px(draw, gx, gy - 2, LEAF_LIGHT)
    # row -1: leaves
    px(draw, gx - 1, gy - 1, LEAF_DARK)
    px(draw, gx, gy - 1, LEAF_MID)
    px(draw, gx + 1, gy - 1, LEAF_DARK)
    # row 0: stem base
    px(draw, gx, gy, LEAF_DARK)


def draw_scarecrow(draw, gx: int, gy_base: int):
    # gy_base: bottom of post (where it meets soil)

    # POST (vertical, 2-wide)
    for y in range(gy_base - 22, gy_base + 1):
        px(draw, gx, y, WOOD)
        px(draw, gx + 1, y, WOOD_DARK)

    # CROSSBAR (arms, 12 wide x 2 tall)
    for x in range(gx - 5, gx + 7):
        px(draw, x, gy_base - 16, WOOD)
        px(draw, x, gy_base - 15, WOOD_DARK)

    # STRAW BODY — chunky shirt over the crossbar
    body_top = gy_base - 14
    body_bot = gy_base - 7
    for x in range(gx - 4, gx + 6):
        for y in range(body_top, body_bot + 1):
            color = STRAW
            if y == body_bot:
                color = STRAW_DARK
            elif (x + y) % 5 == 0:
                color = STRAW_MID
            px(draw, x, y, color)
    # patch on chest
    px(draw, gx, gy_base - 11, PATCH)
    px(draw, gx + 1, gy_base - 11, PATCH)
    px(draw, gx, gy_base - 10, PATCH)
    px(draw, gx + 1, gy_base - 10, PATCH)
    # straw tassels hanging from sleeves & shirt bottom
    for x in (gx - 5, gx - 4, gx + 5, gx + 6):
        px(draw, x, gy_base - 14, STRAW_MID)
        px(draw, x, gy_base - 13, STRAW_DARK)
    for x in range(gx - 3, gx + 5):
        if x % 2 == 0:
            px(draw, x, gy_base - 6, STRAW_MID)

    # HEAD — 6-wide x 5-tall straw blob
    head_top = gy_base - 22
    head_bot = gy_base - 17
    for x in range(gx - 2, gx + 4):
        for y in range(head_top, head_bot):
            color = STRAW
            if (x + y) % 4 == 0:
                color = STRAW_MID
            px(draw, x, y, color)
    # head outline (subtle dark edges)
    for x in range(gx - 2, gx + 4):
        px(draw, x, head_top, STRAW_DARK)

    # FACE — eyes & stitched mouth
    px(draw, gx - 1, gy_base - 20, EYE)
    px(draw, gx + 2, gy_base - 20, EYE)
    px(draw, gx, gy_base - 18, EYE)
    px(draw, gx + 1, gy_base - 18, EYE)

    # HAT — wide brim + crown
    brim_y = gy_base - 23
    for x in range(gx - 4, gx + 6):
        px(draw, x, brim_y, HAT_DARK)
    for x in range(gx - 3, gx + 5):
        px(draw, x, brim_y - 1, HAT_MID)
    # crown
    for x in range(gx - 1, gx + 3):
        px(draw, x, brim_y - 2, HAT_DARK)
        px(draw, x, brim_y - 3, HAT_DARK)
    # hat band accent
    px(draw, gx - 1, brim_y - 1, HAT_DARK)
    px(draw, gx + 2, brim_y - 1, HAT_DARK)


def main():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Three tilled rows of soil — fill lower 2/3 of canvas
    rows = [
        {"top": 60, "height": 7},
        {"top": 73, "height": 7},
        {"top": 86, "height": 7},
    ]
    for r in rows:
        draw_tilled_row(draw, r["top"], r["height"])

    # Sprouts — staggered along each row for organic feel
    for i, r in enumerate(rows):
        sprout_y = r["top"] + r["height"] - 2
        offset = 0 if i % 2 == 0 else 3
        for x in range(8 + offset, 60, 6):
            draw_sprout(draw, x, sprout_y)

    # Scarecrow — back-center, planted into back row
    draw_scarecrow(draw, gx=31, gy_base=58)

    out = Path("game-assets/buildings/little-farm.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(f"Wrote {out} ({W}x{H})")


if __name__ == "__main__":
    main()
