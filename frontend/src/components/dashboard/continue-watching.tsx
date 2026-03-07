import { Shade, createComponent } from '@furystack/shades'
import { Typography } from '@furystack/shades-common-components'
import type { ContinueWatchingWidgetGroup as ContinueWatchingWidgetGroupProps } from 'common'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MovieWidget } from './movie-widget.js'
import { MoviesService } from '../../services/movies-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'

export const ContinueWatchingWidgetGroup = Shade<ContinueWatchingWidgetGroupProps>({
  customElementName: 'continue-watching-widget-group',
  css: {
    '& .continue-watching-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      padding: '1em',
    },
    '& .continue-watching-content': {
      overflow: 'hidden',
      maxWidth: '100%',
    },
    '& .continue-watching-list': {
      display: 'flex',
      overflow: 'auto',
      scrollSnapType: 'x mandatory',
    },
    '& .continue-watching-item': {
      scrollSnapAlign: 'start',
    },
  },
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

          const movieFiles = await movieFileService.findMovieFile({
            filter: {
              $or: watchEntries.entries.map((entry) => ({
                path: { $eq: entry.path },
                driveLetter: { $eq: entry.driveLetter },
              })),
            },
          })

          const { entries: movies } = await movieService.findMovie({
            filter: {
              imdbId: {
                $in: Array.from(
                  new Set(movieFiles.entries.filter((e) => e.imdbId).map((entry) => entry.imdbId as string)),
                ),
              },
            },
          })

          await Promise.all([
            movieFileService.prefetchMovieFilesForMovies(movies),
            watchProgressService.prefetchWatchProgressForFiles(movieFiles.entries),
          ])

          return (
            <div className="continue-watching-container">
              <div className="continue-watching-content">
                <Typography variant="h3">Continue watching</Typography>
                <div className="continue-watching-list">
                  {watchEntries.entries.map((entry, index) => (
                    <div className="continue-watching-item">
                      <MovieWidget
                        imdbId={
                          movieFiles.entries.find(
                            (mf) => mf.driveLetter === entry.driveLetter && mf.path === entry.path,
                          )!.imdbId as string
                        }
                        index={index}
                        size={size || 256}
                      />
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
