#!/usr/bin/env python3
import base64, json, urllib.request, os, sys, pathlib

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCSdG0OFleJPq5v6dmfq7vv9TAwQZT3h9w")
MODEL = "gemini-2.5-flash-image"
ROOT = pathlib.Path(__file__).resolve().parents[1]
PROMPTS_DIR = ROOT / "game-assets/buildings/town-hall-prompts/prompts"
OUT_DIR = ROOT / "game-assets/buildings/town-hall-raw-out"
OUT_DIR.mkdir(parents=True, exist_ok=True)

variants = [("primary", ""), ("glitched", "-glitched"), ("healed", "-healed")]

for variant_id, suffix in variants:
    prompt_json = json.loads((PROMPTS_DIR / f"{variant_id}.json").read_text())
    text_prompt = json.dumps(prompt_json, indent=2)
    payload = {
        "contents": [{"parts": [{"text": text_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    print(f"Generating {variant_id}...", flush=True)
    with urllib.request.urlopen(req, timeout=180) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    saved = False
    for part in result["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            img_bytes = base64.b64decode(part["inlineData"]["data"])
            out = OUT_DIR / f"town-hall{suffix}-raw.png"
            out.write_bytes(img_bytes)
            print(f"  -> {out}")
            saved = True
            break
    if not saved:
        print(f"  !! no image returned for {variant_id}: {result}", file=sys.stderr)
        sys.exit(1)
