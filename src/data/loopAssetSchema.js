/**
 * Loop Asset Schema — canonical shape produced by the GPT bot pipeline.
 *
 * Every JSON file under data/generated/ must conform to this structure so
 * the app can ingest, preview, and eventually export assets automatically.
 */

/** @typedef {'seamless' | 'ping-pong' | 'one-shot'} LoopType */

/** @typedef {'solid' | 'transparent' | 'gradient'} BackgroundType */

/**
 * @typedef {Object} FrameSize
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Background
 * @property {BackgroundType} type
 * @property {string} [color]   - hex color, required when type === 'solid'
 * @property {boolean} transparent
 */

/**
 * @typedef {Object} FramePrompt
 * @property {number} frameIndex   - 0-based
 * @property {string} prompt        - text prompt for this frame
 */

/**
 * @typedef {Object} QualityChecklist
 * @property {boolean | null} loopSeamless
 * @property {boolean | null} framesConsistentStyle
 * @property {boolean | null} colorPaletteConsistent
 * @property {boolean | null} backgroundConsistent
 * @property {boolean | null} noFlicker
 * @property {boolean} exportedToGif
 * @property {boolean} reviewedByHuman
 */

/**
 * @typedef {Object} LoopAsset
 * @property {string}          assetId
 * @property {string}          title
 * @property {string}          characterDescription
 * @property {LoopType}        loopType
 * @property {number}          frameCount
 * @property {FrameSize}       frameSize
 * @property {number}          fps
 * @property {number}          perFrameDurationMs
 * @property {string}          visualStyle
 * @property {string[]}        colorPalette
 * @property {Background}      background
 * @property {FramePrompt[]}   framePrompts
 * @property {QualityChecklist} qualityChecklist
 * @property {string[]}        tags
 * @property {string}          generatedBy
 * @property {string}          createdAt   - ISO 8601
 */

/** Valid loop types */
export const LOOP_TYPES = /** @type {const} */ (['seamless', 'ping-pong', 'one-shot'])

/** Required top-level keys for a valid LoopAsset */
export const REQUIRED_KEYS = /** @type {const} */ ([
  'assetId',
  'title',
  'characterDescription',
  'loopType',
  'frameCount',
  'frameSize',
  'fps',
  'perFrameDurationMs',
  'visualStyle',
  'colorPalette',
  'background',
  'framePrompts',
  'qualityChecklist',
  'tags',
  'createdAt',
])

/**
 * Validates that a plain object has all required LoopAsset keys.
 * Does NOT do deep type validation — this is a fast structural guard only.
 *
 * @param {unknown} raw
 * @returns {{ valid: boolean; missing: string[] }}
 */
export function validateLoopAsset(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, missing: [...REQUIRED_KEYS] }
  }
  const missing = REQUIRED_KEYS.filter((key) => !(key in raw))
  return { valid: missing.length === 0, missing }
}

/**
 * Returns a human-readable quality score string for a LoopAsset.
 * @param {LoopAsset} asset
 * @returns {string}
 */
export function qualityScore(asset) {
  const checks = Object.values(asset.qualityChecklist)
  const passed = checks.filter((v) => v === true).length
  const total = checks.length
  return `${passed} / ${total}`
}
