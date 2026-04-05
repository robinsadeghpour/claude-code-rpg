---
name: nano-banana
description: Generate and edit images using Gemini image models (direct API or Nano Banana CLI). Use for any image generation or image editing request.
allowed-tools: Bash(gemini:*),Bash(python3:*)
---

# Nano Banana Image Generation

Generate images with Gemini using one of two methods:

1. **Direct API** (preferred)
2. **Nano Banana Gemini CLI extension** (optional)

## Use Cases

- Text-to-image generation
- Image editing / transformation
- Batch image generation/editing
- Iterative prompt refinement

## Method 1: Direct API (Preferred)

Requires `GEMINI_API_KEY` in environment.

```bash
export GEMINI_API_KEY="your-key-here"
```

### Recommended Models

| Model | Best For |
|-------|----------|
| `gemini-2.5-flash-image` | Fast generation and edits |
| `gemini-3-pro-image-preview` | Higher quality and complex scenes |

### Text-to-Image Example

```python
import base64, json, urllib.request

API_KEY = "your-api-key"
MODEL = "gemini-2.5-flash-image"

payload = {
    "contents": [{"parts": [{"text": "your prompt here"}]}],
    "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
}

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}, method="POST")

with urllib.request.urlopen(req, timeout=120) as resp:
    result = json.loads(resp.read().decode("utf-8"))

for part in result["candidates"][0]["content"]["parts"]:
    if "inlineData" in part:
        img_bytes = base64.b64decode(part["inlineData"]["data"])
        with open("output.png", "wb") as f:
            f.write(img_bytes)
```

### Image Edit Example (Image + Prompt)

```python
with open("input.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode("utf-8")

payload = {
    "contents": [{"parts": [
        {"inlineData": {"mimeType": "image/png", "data": image_data}},
        {"text": "your edit instruction here"}
    ]}],
    "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
}
# Use the same request flow as text-to-image.
```

### Batch Example

```python
items = [
    ("input1.png", "output1.png", "prompt for image 1"),
    ("input2.png", "output2.png", "prompt for image 2"),
]

for src, dst, prompt in items:
    edit_image(src, dst, prompt)
```

## Method 2: Gemini CLI Extension

### Setup

```bash
gemini extensions list | rg nanobanana
gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
```

### Commands

| Command | Use Case |
|---------|----------|
| `gemini --yolo "/generate 'prompt'"` | Text-to-image generation |
| `gemini --yolo "/edit file.png 'instruction'"` | Modify existing image |
| `gemini --yolo "/icon 'description'"` | Icon generation |
| `gemini --yolo "/diagram 'description'"` | Diagram generation |
| `gemini --yolo "/pattern 'description'"` | Pattern generation |

Output is saved to `./nanobanana-output/`.

## Prompting Guidelines

- Be explicit about subject, composition, style, and lighting.
- State output constraints: transparent background, aspect ratio, no text/watermark.
- For edits, specify what must remain unchanged.
- Use iterative refinement: generate -> inspect -> revise prompt.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Gemini CLI not installed | Use Direct API method instead |
| `GEMINI_API_KEY` not set | Check env or ask user for key |
| Background not transparent | Regenerate with explicit transparency constraint, then clean alpha in post-processing |
| Excess canvas/padding | Trim to content after generation |
| HTTP 404 on model | List models: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=$KEY"` and pick one with "image" in name |
| Inconsistent style across outputs | Use a stable base prompt and keep style-lock fields unchanged across runs |