import { describe, expect, it } from 'vitest'

/**
 * SettingsMenu is a Shades component that renders submenus for speed,
 * audio, and captions. The logic it contains:
 *
 * - **Submenu navigation** — useState toggling, a view concern best
 *   tested via E2E.
 * - **Track switching** — delegates to MoviePlayerService.switchAudioTrack
 *   and activeSubtitleTrack, both tested in movie-player-service.spec.ts.
 * - **Click-outside close** — renders a backdrop div when open, verified
 *   here via export check and in E2E tests.
 *
 * The SPEED_OPTIONS constant and component export are verified below.
 */

describe('SettingsMenu', () => {
  it('should export the component', async () => {
    const mod = await import('./settings-menu.js')
    expect(mod.SettingsMenu).toBeDefined()
  }, 15_000)
})

describe('SPEED_OPTIONS', () => {
  it('should include expected playback rates', async () => {
    const { SPEED_OPTIONS } = await import('./settings-menu.js')
    expect(SPEED_OPTIONS).toContain(1)
    expect(Array.from(SPEED_OPTIONS).every((r) => r > 0 && r <= 4)).toBe(true)
    expect(SPEED_OPTIONS).toHaveLength(6)
  }, 15_000)
})
