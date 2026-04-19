# /// script
# requires-python = ">=3.10"
# ///
"""Generate menu background for Claude Code RPG using Gemini API."""

import base64
import json
import os
import sys
import urllib.request

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.5-flash-image"
OUTPUT_PATH = "public/assets/sprites/menu-background.png"

PROMPT = (
    "Stardew Valley style pixel art scene, 800x600 pixels, cozy village at golden hour sunset. "
    "Small mostly-empty village with just a few houses in the distance, rolling green hills, "
    "warm sunset sky with pink and orange clouds, a dirt path leading toward the village. "
    "Warm color palette: sage green #C5D5A5, cream #FFF8E7, peach #FFB088, sunbeam yellow #FFE066. "
    "Top-down RPG game title screen background. Pixel art style, 16px grid, "
    "limited color count, no text, no UI elements, no characters. "
    "Peaceful, inviting, slightly melancholic — an unfinished world waiting to be built."
)


def main():
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    print(f"Generating menu background with {MODEL}...")

    payload = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    for part in result["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            img_bytes = base64.b64decode(part["inlineData"]["data"])
            os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
            with open(OUTPUT_PATH, "wb") as f:
                f.write(img_bytes)
            print(f"OK: {OUTPUT_PATH} ({len(img_bytes)/1024:.0f} KB)")
            return

    print("ERROR: No image in response")
    sys.exit(1)


if __name__ == "__main__":
    main()
