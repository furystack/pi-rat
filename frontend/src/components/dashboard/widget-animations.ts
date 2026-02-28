import { promisifyAnimation } from '@furystack/shades-common-components'

export const WIDGET_ANIMATION = {
  entrance: {
    duration: 700,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    fill: 'forwards' as const,
    staggerMs: 160,
    delayMs: 1000,
  },
  focusCard: {
    duration: 500,
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    fill: 'forwards' as const,
  },
  focusCover: {
    easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
    fill: 'forwards' as const,
    duration: 850,
  },
  blurCover: {
    fill: 'forwards' as const,
    duration: 150,
  },
}

export const widgetCoverFocus = (card: HTMLElement) => {
  const cover = card.querySelector('.cover')
  if (cover) {
    void promisifyAnimation(
      cover,
      [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
      WIDGET_ANIMATION.focusCover,
    )
  }
}

export const widgetCoverBlur = (card: HTMLElement) => {
  const cover = card.querySelector('.cover')
  if (cover) {
    void promisifyAnimation(cover, [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], WIDGET_ANIMATION.blurCover)
  }
}

export const widgetEntrance = (el: HTMLElement, index: number) => {
  void promisifyAnimation(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
    ...WIDGET_ANIMATION.entrance,
    delay: index * WIDGET_ANIMATION.entrance.staggerMs + Math.random() * 100,
  })
}
