import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { SeriesService } from '../../services/series-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { WidgetGroup } from '../../components/dashboard/widget-group.js'
import { MovieWidget } from '../../components/dashboard/movie-widget.js'

export interface SeriesListProps {
  imdbId: string
}

export const SeriesOverview = Shade<SeriesListProps>({
  shadowDomName: 'series-overview-page',
  render: ({ props, useObservable, injector, element }) => {
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)
    const seriesService = injector.getInstance(SeriesService)
    const moviesService = injector.getInstance(MoviesService)

    return (
      <PiRatLazyLoad
        component={async () => {
          const series = await seriesService.getSeries(props.imdbId)
          const relatedMovies = await moviesService.findMovie({ filter: { seriesId: { $eq: props.imdbId } } })

          const seasons = Array.from(
            new Set(relatedMovies.entries.map((m) => m.season).filter((s) => !isNaN(s as number))),
          ).sort() as number[]

          setTimeout(() => {
            const img = element.querySelector('img')
            img &&
              promisifyAnimation(
                img,
                [
                  { opacity: 0, transform: 'scale(0.85)' },
                  { opacity: 1, transform: 'scale(1)' },
                ],
                {
                  easing: 'cubic-bezier(0.415, 0.225, 0.375, 1.355)',
                  duration: 500,
                  direction: 'alternate',
                  fill: 'forwards',
                },
              )
          }, 100)

          return (
            <div style={{ width: '100%', height: 'calc(100% - 40px', paddingTop: '40px' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  flexWrap: !isDesktop ? 'wrap' : undefined,
                }}>
                <div style={{ padding: '2em' }}>
                  <img
                    src={series.thumbnailImageUrl || ''}
                    alt={`thumbnail for ${series.title}`}
                    style={{ boxShadow: '3px 3px 8px rgba(0,0,0,0.3)', borderRadius: '8px', opacity: '0' }}
                  />
                </div>
                <div
                  style={{
                    padding: '2em',
                    maxWidth: '800px',
                    minWidth: isDesktop ? '550px' : undefined,
                    maxHeight: isDesktop ? 'calc(100% - 128px)' : undefined,
                    overflow: 'hidden',
                    overflowY: isDesktop ? 'auto' : undefined,
                  }}>
                  <h1>{series.title}</h1>
                  <p style={{ fontSize: '0.8em' }}>{series.year?.toString()} &nbsp;</p>
                  <p style={{ textAlign: 'justify' }}>{series.plot}</p>
                  <div style={{ width: '100%', overflow: 'hidden' }}>
                    {seasons.map((s) => (
                      <WidgetGroup
                        type="group"
                        title={`Season ${s}`}
                        widgets={relatedMovies.entries
                          .filter((e) => e.season === s)
                          .map((movie) => ({ type: 'movie', imdbId: movie.imdbId }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      />
    )
  },
})
