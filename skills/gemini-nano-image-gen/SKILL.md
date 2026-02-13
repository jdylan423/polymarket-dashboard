---
name: gemini-nano-image-gen
description: Generate images via Google Gemini Nano. Use when you need to create images programmatically with fast, lightweight image generation.
metadata:
  {
    "openclaw":
      {
        "emoji": "🖼️",
        "requires": { "bins": ["python3"], "env": ["GEMINI_API_KEY"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---

# Gemini Nano Image Gen

Generate images via the Google Gemini API.

## Run

```bash
python3 {baseDir}/scripts/gen.py --prompt "a serene mountain landscape at sunset"
python3 {baseDir}/scripts/gen.py --prompt "cyberpunk city" --count 2
python3 {baseDir}/scripts/gen.py --out-dir ./my-images
```

## Options

```bash
# Basic usage
python3 {baseDir}/scripts/gen.py --prompt "your prompt here"

# Multiple images and custom output
python3 {baseDir}/scripts/gen.py --prompt "quantum computing" --count 4 --out-dir ./images

# Custom output directory
python3 {baseDir}/scripts/gen.py --prompt "abstract art" --out-dir ~/Pictures/ai-gen
```

## Output

- `*.png` images (PNG format)
- `prompts.json` (prompt → file mapping)
- `index.html` (thumbnail gallery)
