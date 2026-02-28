import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Typography } from '@furystack/shades-common-components'
import { WidgetGroup } from '../../components/dashboard/widget-group.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { SeriesService } from '../../services/series-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MediaOverviewLayout } from './media-overview-layout.js'

export type SeriesListProps = {
  imdbId: string
}

export const SeriesOverview = Shade<SeriesListProps>({
  shadowDomName: 'series-overview-page',
  render: ({ props, injector, useObservable }) => {
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)
    const seriesService = injector.getInstance(SeriesService)
    const moviesService = injector.getInstance(MoviesService)
    const movieFileService = injector.getInstance(MovieFilesService)
    const watchProgresses = injector.getInstance(WatchProgressService)

    return (
      <PiRatLazyLoad
        component={async () => {
          const [series, relatedMovies, relatedMovieFiles] = await Promise.all([
            seriesService.getSeries(props.imdbId),
            moviesService.findMovie({ filter: { seriesId: { $eq: props.imdbId } } }),
            movieFileService.findMovieFile({ filter: { imdbId: { $in: [props.imdbId] } } }),
          ])

          await Promise.all([
            movieFileService.prefetchMovieFilesForMovies(relatedMovies.entries),
            watchProgresses.prefetchWatchProgressForFiles(relatedMovieFiles.entries),
          ])

          const seasons = Array.from(
            new Set(relatedMovies.entries.map((m) => m.season).filter((s) => !isNaN(s as number))),
          ).sort() as number[]

          return (
            <MediaOverviewLayout
              thumbnailUrl={series.thumbnailImageUrl || ''}
              title={series.title}
              detailsContainerStyle={{
                maxHeight: isDesktop ? 'calc(100% - 128px)' : undefined,
                overflow: 'hidden',
                overflowY: isDesktop ? 'auto' : undefined,
              }}
            >
              <Typography variant="h1">{series.title}</Typography>
              <Typography variant="caption">{series.year?.toString()} &nbsp;</Typography>
              <Typography variant="body1" align="justify">
                {series.plot}
              </Typography>
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
            </MediaOverviewLayout>
          )
        }}
      />
    )
  },
})
