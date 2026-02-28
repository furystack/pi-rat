import { NestedRouteLink, Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import type { AppPaths } from '../../app-routes.js'
import { WIDGET_ANIMATION, widgetCoverBlur, widgetCoverFocus, widgetEntrance } from './widget-animations.js'

const focus = (el: HTMLElement) => {
  void promisifyAnimation(
    el,
    [
      { opacity: '.7', boxShadow: '1px 3px 6px rgba(0,0,0,0.3)' },
      { opacity: '1', boxShadow: '0px 1px 2px rgba(0,0,0,0.3)' },
    ],
    {
      duration: 1000,
      fill: 'forwards',
      easing: WIDGET_ANIMATION.focusCard.easing,
    },
  )
  widgetCoverFocus(el)
}

const blur = (el: HTMLElement) => {
  void promisifyAnimation(
    el,
    [
      { opacity: '1', boxShadow: '0px 1px 2px rgba(0,0,0,0.3)' },
      { opacity: '.7', boxShadow: '1px 3px 6px rgba(0,0,0,0.3)' },
    ],
    {
      duration: 1200,
      fill: 'forwards',
      easing: WIDGET_ANIMATION.focusCard.easing,
    },
  )
  widgetCoverBlur(el)
}

type IconUrlWidgetProps = {
  index?: number
  description?: string
  url: AppPaths
  icon: JSX.Element
  name: string
}

export const IconUrlWidget = Shade<IconUrlWidgetProps>({
  shadowDomName: 'icon-url-widget',
  css: {
    '& .widget-card': {
      width: '256px',
      height: '256px',
      margin: '8px',
      borderRadius: '8px',
      transform: 'scale(0)',
      overflow: 'hidden',
      placeContent: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      boxShadow: '1px 3px 6px rgba(0,0,0,0.3)',
      background: 'rgba(128,128,128,0.15)',
      opacity: '.7',
    },
    '& .cover': {
      height: '128px',
      fontSize: '96px',
      lineHeight: '128px',
      display: 'block',
      width: '100%',
      placeContent: 'center',
      textAlign: 'center',
      filter: 'drop-shadow(2px 4px 9px rgba(0,0,0,0.5))',
    },
    '& .widget-name': {
      maxWidth: '100%',
      overflow: 'hidden',
      textAlign: 'center',
      textOverflow: 'ellipsis',
    },
  },
  render: ({ props, useRef, useDisposable }) => {
    const cardRef = useRef<HTMLElement>('card')

    useDisposable('entryAnimation', () => {
      const id = setTimeout(() => {
        const el = cardRef.current
        if (el) {
          widgetEntrance(el, props.index || 0)
        }
      })
      return { [Symbol.dispose]: () => clearTimeout(id) }
    })

    const href: string = props.url

    return (
      <NestedRouteLink title={props.description} href={href}>
        <div
          ref={cardRef}
          className="widget-card"
          onmouseenter={(ev) => focus(ev.target as HTMLElement)}
          onfocus={(ev) => focus(ev.target as HTMLElement)}
          onmouseleave={(ev) => blur(ev.target as HTMLElement)}
          onblur={(ev) => blur(ev.target as HTMLElement)}
        >
          <div className="cover">{props.icon}</div>
          <div className="widget-name">{props.name}</div>
        </div>
      </NestedRouteLink>
    )
  },
})
