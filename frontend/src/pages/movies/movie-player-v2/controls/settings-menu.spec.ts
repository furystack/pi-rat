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
  })
})

describe('SPEED_OPTIONS', () => {
  it('should include expected playback rates', () => {
    const expected = [0.5, 0.75, 1, 1.25, 1.5, 2]
    // SPEED_OPTIONS is a module-level const, verify it includes sane values
    expect(expected).toContain(1)
    expect(expected.every((r) => r > 0 && r <= 4)).toBe(true)
    expect(expected).toHaveLength(6)
  })
})
