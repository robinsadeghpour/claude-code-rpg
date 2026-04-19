# /// script
# requires-python = ">=3.10"
# ///
"""Generate tileset for Claude Code RPG using Gemini API."""

import base64
import json
import os
import sys
import time
import urllib.request

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.5-flash-image"
OUTPUT_DIR = "public/assets/tiles"

STYLE_LOCK = (
    "Stardew Valley style pixel art, top-down RPG tile, 16x16 pixel base grid scaled to 256x256, "
    "warm color palette (sage green #C5D5A5, cream #FFF8E7, peach #FFB088), "
    "no outlines on terrain, limited to 6-10 colors, soft lighting from top-left, "
    "must tile seamlessly on all edges, cozy and organic feel"
)

TILES = [
    {
        "name": "grass-light",
        "prompt": f"Light grass tile. {STYLE_LOCK}. Warm sage green base with subtle blade variation, tiny lighter and darker patches for natural look. No flowers. Pure grass texture.",
        "transparent": False,
    },
    {
        "name": "grass-medium",
        "prompt": f"Medium grass tile. {STYLE_LOCK}. Slightly darker sage green than light grass, a few scattered tiny wildflower hints (peach and white dots), natural grass blade texture.",
        "transparent": False,
    },
    {
        "name": "grass-dark",
        "prompt": f"Dark shadowed grass tile. {STYLE_LOCK}. Darker green (#8BA87A), as if in shadow of trees or buildings, grass blade texture visible but muted.",
        "transparent": False,
    },
    {
        "name": "flowers-pink",
        "prompt": f"Flower overlay tile on transparent background. {STYLE_LOCK}. Scattered small pink and peach wildflowers (#FFB088, #FF88AA) with tiny green stems. MUST have fully transparent background (alpha=0). Flowers should be sparse, not covering entire tile.",
        "transparent": True,
    },
    {
        "name": "tall-grass",
        "prompt": f"Tall grass overlay tile on transparent background. {STYLE_LOCK}. Wispy tall grass tufts in varied greens, swaying slightly. MUST have fully transparent background (alpha=0). Scattered placement, not filling entire tile.",
        "transparent": True,
    },
    {
        "name": "mushrooms",
        "prompt": f"Mushroom cluster overlay tile on transparent background. {STYLE_LOCK}. Small clusters of 2-3 cute mushrooms in warm browns and reds. MUST have fully transparent background (alpha=0). Very sparse, small clusters.",
        "transparent": True,
    },
    {
        "name": "dirt-center",
        "prompt": f"Dirt path tile. {STYLE_LOCK}. Warm packed earth brown (#C8B48A), subtle pebble texture, small stones and compressed soil detail. Smooth walking surface feel.",
        "transparent": False,
    },
    {
        "name": "dirt-edge-grass",
        "prompt": f"Dirt-to-grass transition tile. {STYLE_LOCK}. Left half is warm brown dirt (#C8B48A), right half transitions to sage green grass with organic irregular edge between them.",
        "transparent": False,
    },
    {
        "name": "water-deep",
        "prompt": f"Deep water tile. {STYLE_LOCK}. Blue-green pond water (#4A8B9A), subtle ripple pattern, slight transparency feel, dark reflective surface. Calm water.",
        "transparent": False,
    },
    {
        "name": "water-edge",
        "prompt": f"Water shoreline tile. {STYLE_LOCK}. Transition from water (#4A8B9A) to sandy shore (#D4C4A0) with organic curved edge. Some small pebbles at waterline. Natural pond edge.",
        "transparent": False,
    },
]


def generate_image(prompt: str, output_path: str) -> bool:
    """Generate a single image via Gemini API."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        for part in result["candidates"][0]["content"]["parts"]:
            if "inlineData" in part:
                img_bytes = base64.b64decode(part["inlineData"]["data"])
                with open(output_path, "wb") as f:
                    f.write(img_bytes)
                size_kb = len(img_bytes) / 1024
                print(f"  OK ({size_kb:.0f} KB)")
                return True

        print("  WARN: No image in response")
        return False

    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def main():
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Generating {len(TILES)} tiles with {MODEL}...")
    print(f"Output: {OUTPUT_DIR}/")
    print()

    success = 0
    for tile in TILES:
        output_path = os.path.join(OUTPUT_DIR, f"{tile['name']}.png")
        print(f"[{tile['name']}] Generating...", end="", flush=True)

        if generate_image(tile["prompt"], output_path):
            success += 1

        # Rate limit
        time.sleep(2)

    print()
    print(f"Done: {success}/{len(TILES)} tiles generated")
    if success < len(TILES):
        print("Some tiles failed — rerun or generate manually")


if __name__ == "__main__":
    main()
