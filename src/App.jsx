import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronDown,
  ChevronUp,
  Download,
  Film,
  Images,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  Trash2,
} from 'lucide-react'
import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { generatedAssets } from './data/generatedAssets.js'
import { qualityScore } from './data/loopAssetSchema.js'
import './App.css'

const DEFAULT_DURATION = 120
const DEFAULT_SIZE = 512

function createFrame(file, index) {
  return {
    id: `${file.name}-${file.lastModified}-${index}-${crypto.randomUUID()}`,
    name: file.name,
    url: URL.createObjectURL(file),
    duration: DEFAULT_DURATION,
    size: file.size,
  }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawFrame(ctx, image, size, fitMode, background) {
  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)

  const scale =
    fitMode === 'cover'
      ? Math.max(size / image.naturalWidth, size / image.naturalHeight)
      : Math.min(size / image.naturalWidth, size / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const x = (size - width) / 2
  const y = (size - height) / 2

  ctx.drawImage(image, x, y, width, height)
}

async function encodeGif(frames, options) {
  const canvas = document.createElement('canvas')
  canvas.width = options.size
  canvas.height = options.size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const gif = GIFEncoder()

  for (const frame of frames) {
    const image = await loadImage(frame.url)
    drawFrame(ctx, image, options.size, options.fitMode, options.background)
    const pixels = ctx.getImageData(0, 0, options.size, options.size).data
    const palette = quantize(pixels, 256)
    const index = applyPalette(pixels, palette)
    gif.writeFrame(index, options.size, options.size, {
      palette,
      delay: frame.duration,
    })
  }

  gif.finish()
  return new Blob([gif.bytesView()], { type: 'image/gif' })
}

function findForegroundBounds(imageData, alphaThreshold = 16) {
  const { data, width, height } = imageData
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return maxX >= 0 ? { minX, minY, maxX, maxY } : null
}

function makeAlignedCanvas(sourceCanvas, outputSize) {
  const imageData = sourceCanvas
    .getContext('2d')
    .getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const bounds = findForegroundBounds(imageData)

  const out = document.createElement('canvas')
  out.width = outputSize
  out.height = outputSize
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = false

  let dx, dy
  if (bounds) {
    const bboxCenterX = (bounds.minX + bounds.maxX + 1) / 2
    const bboxBottom = bounds.maxY + 1
    dx = Math.round(outputSize / 2 - bboxCenterX)
    dy = Math.round(outputSize * 0.85 - bboxBottom)
  } else {
    // No foreground found — center the cell
    dx = Math.round((outputSize - sourceCanvas.width) / 2)
    dy = Math.round((outputSize - sourceCanvas.height) / 2)
  }
  ctx.drawImage(sourceCanvas, dx, dy)
  return out
}

function centerInSquare(sourceCanvas, outputSize) {
  const out = document.createElement('canvas')
  out.width = outputSize
  out.height = outputSize
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sourceCanvas,
    Math.round((outputSize - sourceCanvas.width) / 2),
    Math.round((outputSize - sourceCanvas.height) / 2),
  )
  return out
}

async function sliceSpriteSheet(file, cols, rows, options = {}) {
  const { autoAlign = false } = options
  const tempUrl = URL.createObjectURL(file)
  const image = await loadImage(tempUrl)
  URL.revokeObjectURL(tempUrl)

  // Output cell size: uniform across all frames
  const outputW = Math.round(image.naturalWidth / cols)
  const outputH = Math.round(image.naturalHeight / rows)
  // Square output so all frames have a consistent size
  const outputSize = Math.max(outputW, outputH)

  const cellCanvas = document.createElement('canvas')
  cellCanvas.width = outputW
  cellCanvas.height = outputH
  const cellCtx = cellCanvas.getContext('2d', { willReadFrequently: true })
  cellCtx.imageSmoothingEnabled = false

  const result = []
  let frameIndex = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Proportional crop: each boundary is rounded independently so
      // rounding error never accumulates across columns/rows.
      const sx = Math.round((col * image.naturalWidth) / cols)
      const sy = Math.round((row * image.naturalHeight) / rows)
      const sx2 = Math.round(((col + 1) * image.naturalWidth) / cols)
      const sy2 = Math.round(((row + 1) * image.naturalHeight) / rows)
      const sw = sx2 - sx
      const sh = sy2 - sy

      cellCtx.clearRect(0, 0, outputW, outputH)
      cellCtx.drawImage(image, sx, sy, sw, sh, 0, 0, outputW, outputH)

      let exportCanvas
      try {
        exportCanvas = autoAlign
          ? makeAlignedCanvas(cellCanvas, outputSize)
          : centerInSquare(cellCanvas, outputSize)
      } catch {
        exportCanvas = cellCanvas
      }

      const blob = await new Promise((resolve) => exportCanvas.toBlob(resolve, 'image/png'))
      if (!blob) continue // skip if canvas export fails

      const padded = String(frameIndex + 1).padStart(2, '0')
      result.push({
        id: `sprite-${file.name}-${row}-${col}-${crypto.randomUUID()}`,
        name: `spritesheet-frame-${padded}`,
        url: URL.createObjectURL(blob),
        duration: DEFAULT_DURATION,
        size: blob.size,
      })
      frameIndex++
    }
  }
  return result
}

function App() {
  const [frames, setFrames] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fitMode, setFitMode] = useState('contain')
  const [exportSize, setExportSize] = useState(DEFAULT_SIZE)
  const [background, setBackground] = useState('#f8fafc')
  const [isExporting, setIsExporting] = useState(false)
  const [spriteFile, setSpriteFile] = useState(null)
  const [spriteCols, setSpriteCols] = useState(4)
  const [spriteRows, setSpriteRows] = useState(4)
  const [isSlicing, setIsSlicing] = useState(false)
  const [spritePreviewUrl, setSpritePreviewUrl] = useState(null)
  const [autoAlign, setAutoAlign] = useState(true)
  const fileInputRef = useRef(null)
  const spriteInputRef = useRef(null)
  const framesRef = useRef([])

  const activeFrame = frames[activeIndex] ?? null
  const totalDuration = useMemo(
    () => frames.reduce((sum, frame) => sum + frame.duration, 0),
    [frames],
  )

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return undefined
    const currentFrame = frames[activeIndex] ?? frames[0]
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % frames.length)
    }, currentFrame.duration)
    return () => window.clearTimeout(timer)
  }, [activeIndex, frames, isPlaying])

  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  useEffect(() => {
    return () => {
      framesRef.current.forEach((frame) => URL.revokeObjectURL(frame.url))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (spritePreviewUrl) URL.revokeObjectURL(spritePreviewUrl)
    }
  }, [spritePreviewUrl])

  function addFiles(fileList) {
    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (imageFiles.length === 0) return
    setFrames((current) => [
      ...current,
      ...imageFiles.map((file, index) => createFrame(file, current.length + index)),
    ])
    setActiveIndex((index) => (frames.length === 0 ? 0 : index))
  }

  function updateFrame(id, updates) {
    setFrames((current) =>
      current.map((frame) => (frame.id === id ? { ...frame, ...updates } : frame)),
    )
  }

  function removeFrame(indexToRemove) {
    setFrames((current) => {
      const frame = current[indexToRemove]
      if (frame) URL.revokeObjectURL(frame.url)
      return current.filter((_, index) => index !== indexToRemove)
    })
    setActiveIndex((index) => Math.max(0, Math.min(index, frames.length - 2)))
  }

  function moveFrame(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= frames.length) return
    setFrames((current) => {
      const next = [...current]
      const [frame] = next.splice(index, 1)
      next.splice(targetIndex, 0, frame)
      return next
    })
    setActiveIndex(targetIndex)
  }

  function clearFrames() {
    frames.forEach((frame) => URL.revokeObjectURL(frame.url))
    setFrames([])
    setActiveIndex(0)
    setIsPlaying(false)
  }

  function handleSpriteFileChange(event) {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setSpriteFile(file)
    setSpritePreviewUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  async function sliceAndImport() {
    if (!spriteFile || isSlicing) return
    setIsSlicing(true)
    try {
      const sliced = await sliceSpriteSheet(spriteFile, spriteCols, spriteRows, { autoAlign })
      setFrames((current) => [...current, ...sliced])
      setActiveIndex((index) => (frames.length === 0 ? 0 : index))
    } finally {
      setIsSlicing(false)
    }
  }

  async function exportGif() {
    if (frames.length === 0 || isExporting) return
    setIsExporting(true)
    try {
      const gifBlob = await encodeGif(frames, {
        size: exportSize,
        fitMode,
        background,
      })
      downloadBlob(gifBlob, `loopforge-${Date.now()}.gif`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Film size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>LoopForge</h1>
            <p>AI sprite sheet → looping GIF converter.</p>
          </div>
        </div>
        <div className="toolbar">
          <button
            className="icon-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Add images"
            aria-label="Add images"
          >
            <Plus size={18} />
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={exportGif}
            disabled={frames.length === 0 || isExporting}
          >
            <Download size={18} />
            {isExporting ? 'Exporting' : 'Export GIF'}
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => addFiles(event.target.files)}
        hidden
      />
      <input
        ref={spriteInputRef}
        type="file"
        accept="image/*"
        onChange={handleSpriteFileChange}
        hidden
      />

      <section className="workspace">
        <aside className="sidebar" aria-label="Frame list">
          <div className="panel-heading">
            <div>
              <h2>Frames</h2>
              <p>
                {frames.length} files / {totalDuration || 0} ms
              </p>
            </div>
            <button
              className="icon-button subtle"
              type="button"
              onClick={clearFrames}
              disabled={frames.length === 0}
              title="Clear frames"
              aria-label="Clear frames"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <div className="sprite-import">
            <div className="sprite-import-header">
              <Layers size={13} aria-hidden="true" />
              <span>Sprite Sheet</span>
            </div>
            <button
              className="drop-zone sprite-drop-zone"
              type="button"
              onClick={() => spriteInputRef.current?.click()}
            >
              {spritePreviewUrl ? (
                <img
                  src={spritePreviewUrl}
                  alt="Sprite sheet preview"
                  className="sprite-thumb"
                />
              ) : (
                <>
                  <Layers size={20} />
                  <span>Select sprite sheet PNG</span>
                </>
              )}
            </button>
            <p className="sprite-hint">Non-divisible images are proportionally sliced.</p>
            <label className="sprite-align-toggle">
              <input
                type="checkbox"
                checked={autoAlign}
                onChange={(event) => setAutoAlign(event.target.checked)}
              />
              <span>Auto align frames</span>
            </label>
            {autoAlign && (
              <p className="sprite-hint">
                Aligns visible pixels to a shared center and foot baseline.
              </p>
            )}
            <div className="sprite-controls">
              <label className="sprite-grid-label">
                <span>Cols</span>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={spriteCols}
                  onChange={(event) =>
                    setSpriteCols(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </label>
              <span className="sprite-grid-sep">×</span>
              <label className="sprite-grid-label">
                <span>Rows</span>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={spriteRows}
                  onChange={(event) =>
                    setSpriteRows(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </label>
              <span className="sprite-frame-count" title="Non-divisible images are proportionally sliced">
                = {spriteCols * spriteRows}
              </span>
              <button
                className="slice-button"
                type="button"
                onClick={sliceAndImport}
                disabled={!spriteFile || isSlicing}
              >
                <Scissors size={14} />
                {isSlicing ? 'Slicing…' : 'Slice'}
              </button>
            </div>
          </div>

          <div className="section-divider" />

          <button
            className="drop-zone"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              addFiles(event.dataTransfer.files)
            }}
          >
            <Images size={24} />
            <span>Drop images or click to import</span>
          </button>

          <div className="frame-list">
            {frames.map((frame, index) => (
              <article
                className={`frame-row ${index === activeIndex ? 'active' : ''}`}
                key={frame.id}
                onClick={() => setActiveIndex(index)}
              >
                <img src={frame.url} alt="" />
                <div className="frame-meta">
                  <strong>{frame.name}</strong>
                  <span>{formatBytes(frame.size)}</span>
                  <label>
                    <span>Delay</span>
                    <input
                      type="number"
                      min="40"
                      step="10"
                      value={frame.duration}
                      onChange={(event) =>
                        updateFrame(frame.id, {
                          duration: Number(event.target.value) || DEFAULT_DURATION,
                        })
                      }
                    />
                    <span>ms</span>
                  </label>
                </div>
                <div className="row-actions">
                  <button
                    className="mini-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      moveFrame(index, -1)
                    }}
                    disabled={index === 0}
                    title="Move up"
                    aria-label="Move up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="mini-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      moveFrame(index, 1)
                    }}
                    disabled={index === frames.length - 1}
                    title="Move down"
                    aria-label="Move down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    className="mini-button danger"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeFrame(index)
                    }}
                    title="Remove"
                    aria-label="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="stage-panel" aria-label="Preview">
          <div className="preview-frame" style={{ backgroundColor: background }}>
            {activeFrame ? (
              <img
                src={activeFrame.url}
                alt={activeFrame.name}
                className={fitMode === 'cover' ? 'cover' : 'contain'}
              />
            ) : (
              <div className="empty-preview">
                <Film size={42} />
                <span>Import frames to preview a loop</span>
              </div>
            )}
          </div>

          <div className="playback-bar">
            <button
              className="transport-button"
              type="button"
              onClick={() => setIsPlaying((value) => !value)}
              disabled={frames.length < 2}
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              title={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <input
              aria-label="Frame scrubber"
              type="range"
              min="0"
              max={Math.max(0, frames.length - 1)}
              value={activeIndex}
              onChange={(event) => {
                setIsPlaying(false)
                setActiveIndex(Number(event.target.value))
              }}
              disabled={frames.length === 0}
            />
            <span className="counter">
              {frames.length === 0 ? '0 / 0' : `${activeIndex + 1} / ${frames.length}`}
            </span>
          </div>
        </section>

        <aside className="settings" aria-label="Export settings">
          <div className="panel-heading">
            <div>
              <h2>Export</h2>
              <p>GIF output settings</p>
            </div>
          </div>

          <label className="field">
            <span>Canvas size</span>
            <select
              value={exportSize}
              onChange={(event) => setExportSize(Number(event.target.value))}
            >
              <option value="320">320 x 320</option>
              <option value="512">512 x 512</option>
              <option value="768">768 x 768</option>
            </select>
          </label>

          <div className="field">
            <span>Fit mode</span>
            <div className="segmented">
              <button
                type="button"
                className={fitMode === 'contain' ? 'selected' : ''}
                onClick={() => setFitMode('contain')}
              >
                Contain
              </button>
              <button
                type="button"
                className={fitMode === 'cover' ? 'selected' : ''}
                onClick={() => setFitMode('cover')}
              >
                Cover
              </button>
            </div>
          </div>

          <label className="field color-field">
            <span>Background</span>
            <input
              type="color"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
            />
          </label>

          <button
            className="wide-button"
            type="button"
            onClick={exportGif}
            disabled={frames.length === 0 || isExporting}
          >
            <Download size={18} />
            {isExporting ? 'Encoding GIF' : 'Export GIF'}
          </button>
        </aside>
      </section>

      <DatasetPreview />
    </main>
  )
}

function DatasetPreview() {
  const [expandedId, setExpandedId] = useState(null)

  function toggle(id) {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <section className="dataset-panel" aria-label="Generated Dataset">
      <div className="dataset-header">
        <div className="dataset-header-left">
          <Bot size={20} aria-hidden="true" />
          <div>
            <h2>Generated Dataset</h2>
            <p>{generatedAssets.length} asset{generatedAssets.length !== 1 ? 's' : ''} · GPT-bot pipeline</p>
          </div>
        </div>
      </div>

      <div className="asset-list">
        {generatedAssets.map((asset) => {
          const isExpanded = expandedId === asset.assetId
          return (
            <article key={asset.assetId} className="asset-card">
              <button
                className="asset-card-summary"
                type="button"
                onClick={() => toggle(asset.assetId)}
                aria-expanded={isExpanded}
              >
                <div className="asset-card-meta">
                  <strong>{asset.title}</strong>
                  <div className="asset-tags">
                    {asset.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="asset-card-stats">
                  <span className="stat">{asset.frameCount} frames</span>
                  <span className="stat loop-type">{asset.loopType}</span>
                  <span className="stat">{asset.fps} fps</span>
                  <span className="stat quality">QC {qualityScore(asset)}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isExpanded && (
                <div className="asset-card-detail">
                  <p className="asset-description">{asset.characterDescription}</p>
                  <div className="detail-row">
                    <span className="detail-label">Style</span>
                    <span>{asset.visualStyle}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Frame size</span>
                    <span>{asset.frameSize.width} × {asset.frameSize.height}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Palette</span>
                    <div className="palette-swatches">
                      {asset.colorPalette.map((color) => (
                        <span
                          key={color}
                          className="swatch"
                          style={{ background: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="prompt-list-heading">Frame prompts</div>
                  <ol className="prompt-list">
                    {asset.framePrompts.map((fp) => (
                      <li key={fp.frameIndex}>{fp.prompt}</li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default App
