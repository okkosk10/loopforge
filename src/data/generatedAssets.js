/**
 * Generated loop asset dataset.
 *
 * These objects are the canonical output of the GPT-bot pipeline.
 * Add new entries here (or load them dynamically) as the bot produces more assets.
 *
 * All entries conform to the LoopAsset schema defined in ./loopAssetSchema.js.
 */

/** @type {import('./loopAssetSchema').LoopAsset} */
const campfireIdleLoop = {
  assetId: 'loop-asset-001',
  title: 'Campfire Idle Loop',
  characterDescription:
    'A small stylized campfire with orange and yellow flames dancing above a pile of logs. No character present — pure ambient loop.',
  loopType: 'seamless',
  frameCount: 8,
  frameSize: { width: 512, height: 512 },
  fps: 12,
  perFrameDurationMs: 83,
  visualStyle: 'flat vector illustration, slightly textured, warm palette',
  colorPalette: ['#FF6B35', '#F7C59F', '#FFBA08', '#3A1C0E', '#1A1A2E'],
  background: { type: 'solid', color: '#1A1A2E', transparent: false },
  framePrompts: [
    {
      frameIndex: 0,
      prompt:
        'Campfire frame 1 of 8. Flames at rest position, logs fully visible, base flame low and wide. Flat vector style, warm night palette.',
    },
    {
      frameIndex: 1,
      prompt:
        'Campfire frame 2 of 8. Flames begin to rise, center flame slightly taller, ember particles drift upward left. Same style.',
    },
    {
      frameIndex: 2,
      prompt:
        'Campfire frame 3 of 8. Flames at mid height, right flame leans slightly right, two ember sparks at upper quarter. Same style.',
    },
    {
      frameIndex: 3,
      prompt:
        'Campfire frame 4 of 8. Flames at peak height, center spike reaches 60% of canvas height, bright yellow core visible. Same style.',
    },
    {
      frameIndex: 4,
      prompt:
        'Campfire frame 5 of 8. Flames begin to contract, wide base, three embers dispersing upward. Same style.',
    },
    {
      frameIndex: 5,
      prompt:
        'Campfire frame 6 of 8. Flames mid-contract, left flame curls inward, ember trail fades. Same style.',
    },
    {
      frameIndex: 6,
      prompt:
        'Campfire frame 7 of 8. Flames low again, wide and flat, subtle glow around logs, no embers. Same style.',
    },
    {
      frameIndex: 7,
      prompt:
        'Campfire frame 8 of 8. Flames nearly identical to frame 1 to close the loop cleanly. Logs and base unchanged. Same style.',
    },
  ],
  qualityChecklist: {
    loopSeamless: true,
    framesConsistentStyle: true,
    colorPaletteConsistent: true,
    backgroundConsistent: true,
    noFlicker: null,
    exportedToGif: false,
    reviewedByHuman: false,
  },
  tags: ['fire', 'ambient', 'idle', 'seamless', 'vector', 'night', 'campfire'],
  generatedBy: 'gpt-bot-v1',
  createdAt: '2026-05-26T00:00:00.000Z',
}

/** All generated assets available in the app. Append new entries here. */
export const generatedAssets = [campfireIdleLoop]
