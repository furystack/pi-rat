import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WIDGET_ANIMATION, widgetCoverBlur, widgetCoverFocus, widgetEntrance } from './widget-animations.js'

vi.mock('@furystack/shades-common-components', () => ({
  promisifyAnimation: vi.fn(),
}))

import { promisifyAnimation } from '@furystack/shades-common-components'

describe('widget-animations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WIDGET_ANIMATION constants', () => {
    it('should have entrance config with expected properties', () => {
      expect(WIDGET_ANIMATION.entrance).toEqual({
        duration: 700,
        easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
        fill: 'forwards',
        staggerMs: 160,
        delayMs: 1000,
      })
    })

    it('should have focusCard config with expected properties', () => {
      expect(WIDGET_ANIMATION.focusCard).toEqual({
        duration: 500,
        easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
        fill: 'forwards',
      })
    })

    it('should have focusCover config with expected properties', () => {
      expect(WIDGET_ANIMATION.focusCover).toEqual({
        easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
        fill: 'forwards',
        duration: 850,
      })
    })

    it('should have blurCover config with expected properties', () => {
      expect(WIDGET_ANIMATION.blurCover).toEqual({
        fill: 'forwards',
        duration: 150,
      })
    })
  })

  describe('widgetCoverFocus', () => {
    it('should animate the .cover child element to scale(1.1)', () => {
      const coverEl = document.createElement('div')
      const card = document.createElement('div')
      coverEl.classList.add('cover')
      card.appendChild(coverEl)

      widgetCoverFocus(card)

      expect(promisifyAnimation).toHaveBeenCalledWith(
        coverEl,
        [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
        WIDGET_ANIMATION.focusCover,
      )
    })

    it('should not call promisifyAnimation if no .cover element exists', () => {
      const card = document.createElement('div')

      widgetCoverFocus(card)

      expect(promisifyAnimation).not.toHaveBeenCalled()
    })
  })

  describe('widgetCoverBlur', () => {
    it('should animate the .cover child element back to scale(1)', () => {
      const coverEl = document.createElement('div')
      const card = document.createElement('div')
      coverEl.classList.add('cover')
      card.appendChild(coverEl)

      widgetCoverBlur(card)

      expect(promisifyAnimation).toHaveBeenCalledWith(
        coverEl,
        [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
        WIDGET_ANIMATION.blurCover,
      )
    })

    it('should not call promisifyAnimation if no .cover element exists', () => {
      const card = document.createElement('div')

      widgetCoverBlur(card)

      expect(promisifyAnimation).not.toHaveBeenCalled()
    })
  })

  describe('widgetEntrance', () => {
    it('should animate element from scale(0) to scale(1) with staggered delay', () => {
      const el = document.createElement('div')
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      widgetEntrance(el, 2)

      expect(promisifyAnimation).toHaveBeenCalledWith(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        ...WIDGET_ANIMATION.entrance,
        delay: 2 * WIDGET_ANIMATION.entrance.staggerMs + 50,
      })
    })

    it('should use index 0 for the first widget', () => {
      const el = document.createElement('div')
      vi.spyOn(Math, 'random').mockReturnValue(0)

      widgetEntrance(el, 0)

      expect(promisifyAnimation).toHaveBeenCalledWith(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        ...WIDGET_ANIMATION.entrance,
        delay: 0,
      })
    })
  })
})
