import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'

import { WIDGET_ANIMATION, widgetCoverBlur, widgetCoverFocus, widgetEntrance } from './widget-animations.js'

type WidgetCardProps = {
  size?: number
  index?: number
}

const focus = (card: HTMLElement) => {
  void promisifyAnimation(
    card,
    [{ filter: 'saturate(0.3)brightness(0.6)' }, { filter: 'saturate(1)brightness(1)' }],
    WIDGET_ANIMATION.focusCard,
  )
  widgetCoverFocus(card)
}

const blur = (card: HTMLElement) => {
  void promisifyAnimation(
    card,
    [{ filter: 'saturate(1)brightness(1)' }, { filter: 'saturate(0.3)brightness(0.6)' }],
    WIDGET_ANIMATION.focusCard,
  )
  widgetCoverBlur(card)
}

export const WidgetCard = Shade<WidgetCardProps>({
  shadowDomName: 'pi-rat-widget-card',
  css: {
    '& .card': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      filter: 'saturate(0.3)brightness(0.6)',
      background: 'rgba(128,128,128,0.1)',
      transform: 'scale(0)',
      borderRadius: '4px',
      margin: '8px',
      overflow: 'hidden',
      color: 'white',
    },
    '& .cover': {
      display: 'inline-block',
      objectFit: 'cover',
      width: '100%',
      height: '100%',
      transform: 'scale(1)',
    },
    '& .overlay': {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '1',
      fontSize: '1.3em',
      width: 'calc(100% - 2em)',
      display: 'flex',
      margin: '1em',
      justifyContent: 'space-between',
    },
    '& .title-bar': {
      width: 'calc(100% - 2em)',
      overflow: 'hidden',
      textAlign: 'center',
      textOverflow: 'ellipsis',
      position: 'absolute',
      bottom: '0',
      whiteSpace: 'nowrap',
      padding: '1em',
      background: 'rgba(0,0,0,0.7)',
    },
  },
  render: ({ props, children, useRef, useDisposable }) => {
    const { size = 256, index = 0 } = props
    const cardRef = useRef<HTMLElement>('card')

    useDisposable('entryAnimation', () => {
      const id = setTimeout(() => {
        const el = cardRef.current
        if (el) {
          widgetEntrance(el, index)
        }
      }, WIDGET_ANIMATION.entrance.delayMs)
      return { [Symbol.dispose]: () => clearTimeout(id) }
    })

    return (
      <div
        ref={cardRef}
        className="card"
        style={{ width: `${size}px`, height: `${size}px` }}
        onfocus={(ev) => focus(ev.target as HTMLElement)}
        onblur={(ev) => blur(ev.target as HTMLElement)}
        onmouseenter={(ev) => focus(ev.target as HTMLElement)}
        onmouseleave={(ev) => blur(ev.target as HTMLElement)}
      >
        {children}
      </div>
    )
  },
})
