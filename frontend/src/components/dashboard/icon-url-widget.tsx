import { NestedRouteLink, Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'

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
      easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    },
  )
  void promisifyAnimation(
    el.querySelector('.cover') as HTMLImageElement,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
    {
      fill: 'forwards',
      easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
      duration: 850,
    },
  )
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
      easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    },
  )
  void promisifyAnimation(
    el.querySelector('.cover') as HTMLImageElement,
    [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { fill: 'forwards', duration: 150 },
  )
}

type IconUrlWidgetProps = {
  index?: number
  description?: string
  url: string
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
  render: ({ props, useRef }) => {
    const cardRef = useRef<HTMLElement>('card')
    setTimeout(() => {
      const el = cardRef.current
      if (el) {
        void promisifyAnimation(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
          fill: 'forwards',
          delay: (props.index || 0) * 160 + Math.random() * 100,
          duration: 700,
          easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
        })
      }
    })

    return (
      <NestedRouteLink title={props.description} href={props.url}>
        <div
          ref={cardRef}
          className="widget-card"
          onmouseenter={(ev) => focus(ev.target as HTMLElement)}
          onfocus={(ev) => focus(ev.target as HTMLElement)}
          onmouseleave={(ev) => blur(ev.target as HTMLElement)}
          onblur={(ev) => blur(ev.target as HTMLElement)}
          onclick={(ev) => {
            if (props.url.startsWith('http') && new URL(props.url).href !== window.location.href) {
              ev.preventDefault()
              ev.stopImmediatePropagation()
              window.location.replace(props.url)
            }
          }}
        >
          <div className="cover">{props.icon}</div>
          <div className="widget-name">{props.name}</div>
        </div>
      </NestedRouteLink>
    )
  },
})
