# LoopForge

LoopForge is a browser tool that converts **AI-generated sprite sheets into looping GIFs**.

A GPT bot produces a sprite sheet PNG (recommended: 4 × 4 grid, 16 frames, transparent background, no labels, no borders).  
LoopForge slices the sheet into individual frames, lets you reorder and time them, then exports an animated GIF.

## Workflow

```
GPT Bot
  └─ generates sprite sheet PNG  (4×4, 512×512 per cell, transparent bg)
       └─ LoopForge — Sprite Sheet Import
            ├─ set cols / rows → Slice & Import
            ├─ reorder frames, set per-frame delay
            ├─ preview the loop
            └─ Export GIF
```

## Recommended GPT bot output spec

| Parameter | Value |
|---|---|
| Grid | 4 × 4 (16 frames) |
| Cell size | 512 × 512 px |
| Background | Transparent (PNG) |
| Labels / borders | None |
| Format | PNG sprite sheet (single image) |

## Pipeline overview (GPT-bot data)

```
GPT Bot
  └─ produces JSON (LoopAsset schema)
       └─ data/generated/*.json
            └─ LoopForge — Generated Dataset panel
                 └─ inspect prompts, tags, QC status → drive image generation
```

## LoopAsset schema (GPT-bot JSON output)

| Field | Type | Description |
|---|---|---|
| `assetId` | string | Unique identifier |
| `title` | string | Human-readable name |
| `characterDescription` | string | What the asset depicts |
| `loopType` | `seamless` \| `ping-pong` \| `one-shot` | How the loop closes |
| `frameCount` | number | Total frames |
| `frameSize` | `{ width, height }` | Cell size in pixels |
| `fps` | number | Target playback rate |
| `perFrameDurationMs` | number | Milliseconds per frame |
| `visualStyle` | string | Style descriptor |
| `colorPalette` | string[] | Hex colors |
| `background` | `{ type, color?, transparent }` | Background spec |
| `framePrompts` | `{ frameIndex, prompt }[]` | Per-frame prompts |
| `qualityChecklist` | object | Human review flags |
| `tags` | string[] | Filter tags |
| `createdAt` | ISO 8601 | Generation timestamp |

## Project structure

```
data/
  generated/              ← JSON files produced by the GPT bot
    sample-loop-asset.json
experiments/
  sprite-generator.html   ← canvas experiments (not product code)
src/
  data/
    loopAssetSchema.js    ← schema types, validation, helpers
    generatedAssets.js    ← exports generatedAssets array
  App.jsx                 ← sprite sheet import + frame sequencer + dataset preview
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

## Next build layers

1. **Bot harness** — script that calls OpenAI API with a LoopAsset template → writes to `data/generated/`
2. **Image generation** — pass each `framePrompt` to an image model, stitch results into a sprite sheet
3. **Auto-import** — watch `data/generated/` for new JSON and surface assets in the Dataset panel automatically
4. **QC tooling** — mark checklist items in the UI, write back to JSON
5. **One-click export** — load a reviewed asset's sprite sheet and export GIF without manual input
6. **WebP / APNG exporters** — additional formats behind a shared export interface


A GPT bot repeatedly produces structured loop asset data (prompts, frame specs, quality checklists, tags).  
LoopForge ingests that data, lets a human review it, and will eventually drive image generation + GIF export from it.

## Pipeline overview

```
GPT Bot
  └─ produces JSON (LoopAsset schema)
       └─ data/generated/*.json
            └─ LoopForge app
                 ├─ Dataset Preview panel  ← inspect prompts, tags, QC status
                 ├─ Frame sequencer        ← import rendered frames, set delays
                 └─ GIF export             ← output the final loop
```

## LoopAsset schema (minimum required fields)

| Field | Type | Description |
|---|---|---|
| `assetId` | string | Unique identifier |
| `title` | string | Human-readable name |
| `characterDescription` | string | What the asset depicts |
| `loopType` | `seamless` \| `ping-pong` \| `one-shot` | How the loop closes |
| `frameCount` | number | Total frames in the sequence |
| `frameSize` | `{ width, height }` | Canvas size in pixels |
| `fps` | number | Target playback rate |
| `perFrameDurationMs` | number | Milliseconds per frame |
| `visualStyle` | string | Style descriptor for prompts |
| `colorPalette` | string[] | Hex color array |
| `background` | `{ type, color?, transparent }` | Background spec |
| `framePrompts` | `{ frameIndex, prompt }[]` | Per-frame generation prompts |
| `qualityChecklist` | object | Pass/fail flags reviewed by human |
| `tags` | string[] | Search and filter tags |
| `createdAt` | ISO 8601 string | Generation timestamp |

## Project structure

```
data/
  generated/          ← JSON files produced by the GPT bot
    sample-loop-asset.json
experiments/
  sprite-generator.html   ← temporary canvas experiments (not product code)
src/
  data/
    loopAssetSchema.js  ← schema constants, validation helper, JSDoc types
    generatedAssets.js  ← imports JSON data, exports generatedAssets array
  App.jsx             ← frame sequencer + Dataset Preview panel
  App.css
```

## MVP scope (frame sequencer)

- Import multiple image frames
- Reorder frames
- Set per-frame delay
- Preview the animation loop
- Export an animated GIF

## Local development

```bash
npm install
npm run dev
```

PowerShell users may need the `.cmd` shims:

```powershell
npm.cmd install
npm.cmd run dev
```

## Next build layers (GPT-bot pipeline)

1. **Bot harness** — script that calls OpenAI API with a LoopAsset prompt template and writes the result to `data/generated/`
2. **Image generation** — pass each `framePrompt` to an image model; save frames locally
3. **Auto-import** — watch `data/generated/` for new JSON and surface new assets in the Dataset Preview automatically
4. **QC tooling** — let the human mark checklist items in the UI and write back to the JSON
5. **One-click export** — load frames from a reviewed asset and run GIF export without manual import
6. **WebP / APNG exporters** — additional export formats behind a shared export interface

