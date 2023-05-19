import { Shade, createComponent } from '@furystack/shades'
import type { ContinueWatchingWidgetGroup as ContinueWatchingWidgetGroupProps } from 'common'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MovieWidget } from './movie-widget.js'
import { MoviesService } from '../../services/movies-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'

export const ContinueWatchingWidgetGroup = Shade<ContinueWatchingWidgetGroupProps>({
  shadowDomName: 'continue-watching-widget-group',
  render: ({ props, injector }) => {
    const { count, size } = props

    const watchProgressService = injector.getInstance(WatchProgressService)
    const movieService = injector.getInstance(MoviesService)
    const movieFileService = injector.getInstance(MovieFilesService)

    return (
      <PiRatLazyLoad
        component={async () => {
          const watchEntries = await watchProgressService.findWatchProgress({
            top: count,
            order: {
              updatedAt: 'DESC',
            },
          })

          const { entries: movies } = await movieService.findMovie({
            filter: {
              imdbId: {
                $in: Array.from(new Set(watchEntries.entries.map((entry) => entry.imdbId))),
              },
            },
          })

          await Promise.all([
            movieFileService.prefetchMovieFilesForMovies(movies),
            watchProgressService.prefetchWatchProgressForMovies(movies),
          ])

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'hidden',
                padding: '1em',
              }}>
              <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
                <h3>Continue watching</h3>
                <div style={{ display: 'flex', overflow: 'auto', scrollSnapType: 'x mandatory' } as any}>
                  {watchEntries.entries.map((entry, index) => (
                    <div style={{ scrollSnapAlign: 'start' } as any}>
                      <MovieWidget imdbId={entry.imdbId} index={index} size={size || 256} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }}
      />
    )
  },
})
