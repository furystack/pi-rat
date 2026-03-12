import { describe, expect, it } from 'vitest'

/**
 * VideoContainer is a Shades component whose logic is integration-level:
 *
 * - **Keyboard shortcuts** delegate to MoviePlayerService methods
 *   (togglePlay, seekToTime, setMuted, toggleFullscreen), all covered in
 *   movie-player-service.spec.ts.
 *
 * - **Idle timer** toggles a CSS class via mouse events — best tested
 *   through E2E (video-playback.spec.ts).
 *
 * - **Auto-focus** on mount uses whenRefReady — tested in
 *   when-ref-ready.spec.ts.
 *
 * Rendering-level behavior (overlay visibility, controls wrapper class
 * toggling) requires the full Shades rendering environment and is verified
 * by E2E tests.
 */

describe('VideoContainer', () => {
  it('should export the component', async () => {
    const mod = await import('./video-container.js')
    expect(mod.VideoContainer).toBeDefined()
  })
})
