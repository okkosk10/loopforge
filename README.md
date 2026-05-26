# LoopForge

LoopForge is the review and assembly layer for a **GPT-bot-driven loop animation asset pipeline**.

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

