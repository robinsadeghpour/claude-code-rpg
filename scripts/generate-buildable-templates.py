#!/usr/bin/env python3
"""Pre-generate the three buildable templates (house, farm, lantern) once via
Gemini's image API so the in-game player skill can just copy the PNG at runtime
instead of re-rolling the model.

Run from project root:
    python scripts/generate-buildable-templates.py
or
    python scripts/generate-buildable-templates.py --kinds house,lantern

Reads GEMINI_API_KEY from environment or .env. Writes:
    game-assets/buildings/templates/house.png
    game-assets/buildings/templates/farm.png
    game-assets/buildings/templates/lantern.png
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = ROOT / "game-assets" / "buildings" / "templates"
ENV_FILE = ROOT / ".env"
MODEL = "gemini-2.5-flash-image"
ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{MODEL}:generateContent"
)

# Style-lock string shared across all three buildables so they look like a set.
# Mirrors brand-and-tone palette + town-hall.png look (Stardew-ish cozy pixel art).
STYLE_LOCK = (
    "Cozy pixel-art village asset, Stardew Valley aesthetic, front-facing with "
    "slight 3/4 top-down perspective. Warm healthy palette: cream walls "
    "(#FFF8E7), soft sage roofs (#C5D5A5), warm brown wood (#8B6549), terracotta "
    "accents (#C67B5C), peach highlights (#FFB088). Crisp 1px outlines on "
    "structure, no anti-aliased blur, 6-10 distinct colors. Single subject "
    "centered, transparent background, no shadow plate, no text, no watermark, "
    "no scene clutter, no people, no extra props. Output only the asset itself."
)

PROMPTS: dict[str, str] = {
    "house": (
        "A small cozy cottage. One central wooden door, two square windows with "
        "warm yellow-lit glass, a steep sage-green tile roof with a small brick "
        "chimney venting a curl of smoke, cream stone walls with a low "
        "terracotta foundation, a tiny window-box of pink flowers under one "
        "window. Inviting and quiet. " + STYLE_LOCK
    ),
    "farm": (
        "A small farm plot. Three rows of freshly tilled brown soil with green "
        "carrot tops sprouting, a tiny straw scarecrow with a peaked hat and a "
        "stick crossbeam standing in the back row, a wooden bucket beside the "
        "rows. No fence, no buildings, just the plot and the scarecrow. "
        + STYLE_LOCK
    ),
    "lantern": (
        "A small village lamp post sprite. A wooden vertical post mounted on a "
        "square cobblestone base. At the top of the post hangs a four-paned "
        "glass lantern with a warm yellow flame visible inside, surrounded by "
        "a soft golden glow halo. Cozy and inviting, like a Stardew Valley "
        "decoration item. " + STYLE_LOCK
    ),
}


def load_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            name, value = line.split("=", 1)
            if name.strip() == "GEMINI_API_KEY":
                return value.strip().strip('"').strip("'")
    raise SystemExit(
        "GEMINI_API_KEY not found in environment or .env. Set it and retry."
    )


def call_gemini(api_key: str, prompt: str) -> bytes:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }
    url = f"{ENDPOINT}?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Gemini HTTP {exc.code}: {body}") from exc

    candidates = result.get("candidates") or []
    if not candidates:
        raise SystemExit(f"Gemini returned no candidates: {json.dumps(result)[:500]}")
    for part in candidates[0].get("content", {}).get("parts", []):
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and "data" in inline:
            return base64.b64decode(inline["data"])
    raise SystemExit(
        f"Gemini response had no inline image data: {json.dumps(result)[:500]}"
    )


def normalize(raw_bytes: bytes, kind: str, max_w: int = 640, max_h: int = 1024) -> Image.Image:
    """Remove dark/transparent background, trim to content, optional clamp."""
    from io import BytesIO

    img = Image.open(BytesIO(raw_bytes)).convert("RGBA")
    px = img.load()
    w, h = img.size
    dark_threshold = 28
    alpha_noise_threshold = 24
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < alpha_noise_threshold:
                px[x, y] = (r, g, b, 0)
                continue
            if r < dark_threshold and g < dark_threshold and b < dark_threshold:
                px[x, y] = (r, g, b, 0)

    bbox = img.getbbox()
    if bbox is not None:
        img = img.crop(bbox)

    cw, ch = img.size
    if cw > max_w or ch > max_h:
        scale = min(max_w / cw, max_h / ch)
        img = img.resize(
            (max(1, int(cw * scale)), max(1, int(ch * scale))),
            Image.Resampling.NEAREST,
        )
    return img


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--kinds",
        default="house,farm,lantern",
        help="comma-separated kinds to generate (default: all three)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=TEMPLATES_DIR,
        help="output directory (default: game-assets/buildings/templates)",
    )
    parser.add_argument(
        "--keep-raw",
        action="store_true",
        help="also save the unprocessed model output as <kind>-raw.png",
    )
    args = parser.parse_args()

    kinds = [k.strip() for k in args.kinds.split(",") if k.strip()]
    unknown = [k for k in kinds if k not in PROMPTS]
    if unknown:
        raise SystemExit(f"Unknown kinds: {unknown}. Valid: {list(PROMPTS)}")

    api_key = load_api_key()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    for kind in kinds:
        prompt = PROMPTS[kind]
        print(f"[{kind}] generating with {MODEL}...", flush=True)
        raw = call_gemini(api_key, prompt)
        if args.keep_raw:
            (args.out_dir / f"{kind}-raw.png").write_bytes(raw)
        normalized = normalize(raw, kind)
        out_path = args.out_dir / f"{kind}.png"
        normalized.save(out_path)
        print(
            f"[{kind}] wrote {out_path.relative_to(ROOT)} "
            f"({normalized.width}x{normalized.height})"
        )

    print("Done. Templates ready in", args.out_dir.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
