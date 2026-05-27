# LoopForge

LoopForge is a browser tool that converts **AI-generated sprite sheets into looping GIFs**.

A GPT bot (or any image generator) produces a sprite sheet PNG.  
LoopForge slices the sheet into individual frames, lets you reorder and time them, then exports an animated GIF — entirely in the browser, no upload required.

## Workflow

```
AI / GPT
  └─ generates sprite sheet PNG  (recommended: 4×4, transparent bg, no labels)
       └─ LoopForge — Sprite Sheet Import
            ├─ set cols / rows → Slice & Import
            ├─ reorder frames, set per-frame delay
            ├─ preview the loop
            └─ Export GIF
```

## Recommended sprite sheet spec

| Parameter | Value |
|---|---|
| Grid | 4 × 4 (16 frames) |
| Cell size | 512 × 512 px |
| Background | Transparent (PNG) |
| Labels / borders | None |
| Format | Single PNG sprite sheet |

## Features

- **Sprite sheet import** — drag-and-drop or click to load a PNG sprite sheet
- **Cols / rows config** — set grid dimensions before slicing
- **Slice & Import** — proportionally crops each cell; non-divisible sheets are handled cleanly
- **Auto-align frames** — aligns visible pixels to a shared center and foot baseline (optional)
- **Frame reorder** — move frames up/down in the sequence
- **Per-frame delay** — set individual frame durations in milliseconds
- **Preview** — step through frames or play the loop in real time
- **GIF export** — encode and download an animated GIF at 320, 512, or 768 px

## Project structure

```
experiments/
  sprite-generator.html   ← canvas experiments (not product code)
src/
  App.jsx                 ← sprite sheet import + frame sequencer + GIF export
  App.css
```

## Local development

```bash
npm install
npm run dev
```

PowerShell users:

```powershell
npm.cmd install
npm.cmd run dev
```

## Next steps

1. **Sprite slicing polish** — better handling of transparent padding / uneven grids
2. **Preview improvements** — onion-skin overlay, loop count control
3. **WebP / APNG export** — additional formats behind a shared export interface
4. **Frame trimming** — auto-detect and skip blank/duplicate frames
