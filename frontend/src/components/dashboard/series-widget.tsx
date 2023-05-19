import { Shade, RouteLink, createComponent } from '@furystack/shades'
import { Skeleton, promisifyAnimation } from '@furystack/shades-common-components'
import { isFailedCacheResult, isLoadedCacheResult, isPendingCacheResult } from '@furystack/cache'
import { SeriesService } from '../../services/series-service.js'

const focus = (el: HTMLElement) => {
  promisifyAnimation(el, [{ filter: 'saturate(0.3)brightness(0.6)' }, { filter: 'saturate(1)brightness(1)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  promisifyAnimation(
    el.querySelector('img.cover') as HTMLImageElement,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
    {
      fill: 'forwards',
      easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
      duration: 850,
    },
  )
}

const blur = (el: HTMLElement) => {
  promisifyAnimation(el, [{ filter: 'saturate(1)brightness(1)' }, { filter: 'saturate(0.3)brightness(0.6)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  promisifyAnimation(
    el.querySelector('img.cover') as HTMLImageElement,
    [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { fill: 'forwards', duration: 150 },
  )
}

export const SeriesWidget = Shade<{
  imdbId: string
  index?: number
  size?: number
}>({
  shadowDomName: 'pi-rat-series-widget',
  constructed: ({ props, element }) => {
    setTimeout(() => {
      promisifyAnimation(element.querySelector('a div'), [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        fill: 'forwards',
        delay: (props.index || 0) * 160 + Math.random() * 100,
        duration: 700,
        easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
      })
    }, 1000)
  },
  render: ({ props, injector, useObservable }) => {
    const { imdbId, size = 256 } = props

    const seriesService = injector.getInstance(SeriesService)
    const [series] = useObservable('movie', seriesService.getSeriesAsObservable(imdbId))

    const url = `/series/${imdbId}`

    if (isLoadedCacheResult(series)) {
      return (
        <RouteLink tabIndex={0} title={series.value.plot || series.value.title} href={url}>
          <div
            onfocus={(ev) => focus(ev.target as HTMLElement)}
            onblur={(ev) => blur(ev.target as HTMLElement)}
            onmouseenter={(ev) => focus(ev.target as HTMLElement)}
            onmouseleave={(ev) => blur(ev.target as HTMLElement)}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: `${size}px`,
              height: `${size}px`,
              filter: 'saturate(0.3)brightness(0.6)',
              background: 'rgba(128,128,128,0.1)',
              transform: 'scale(0)',
              borderRadius: '4px',
              margin: '8px',
              overflow: 'hidden',
              color: 'white',
            }}
            onclick={(ev) => {
              if (url.startsWith('http') && new URL(url).href !== window.location.href) {
                ev.preventDefault()
                ev.stopImmediatePropagation()
                window.location.replace(url)
              }
            }}>
            <img
              src={series.value.thumbnailImageUrl as string}
              alt={series.value.title}
              className="cover"
              style={{
                display: 'inline-block',
                backgroundColor: '#666',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                transform: 'scale(1)',
              }}
            />
            <div
              style={{
                width: 'calc(100% - 2em)',
                overflow: 'hidden',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                position: 'absolute',
                bottom: '0',
                whiteSpace: 'nowrap',
                padding: '1em',
                background: 'rgba(0,0,0,0.7)',
              }}>
              {series.value.title}
            </div>
          </div>
        </RouteLink>
      )
    } else if (isPendingCacheResult(series)) {
      return <Skeleton />
    } else if (isFailedCacheResult(series)) {
      return <>:(</>
    }

    return null
  },
})
