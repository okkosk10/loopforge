# LoopForge

LoopForge is a browser-first tool for turning image sequences into lightweight looping sticker exports.

## MVP scope

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

## Next build layers

- Add WebP/APNG/MP4 exporters behind a shared export interface
- Persist projects locally
- Wrap the web core with Electron
- Add AI image generation as a provider module, not as a dependency of the frame editor
