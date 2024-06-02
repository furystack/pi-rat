import type { CommandProvider } from '@furystack/shades-common-components'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { createComponent } from '@furystack/shades'
import { WidgetGroup } from '../../dashboard/widget-group.js'
import { MovieFilesService } from '../../../services/movie-files-service.js'
import { MoviesService } from '../../../services/movies-service.js'

export const continueWatchingCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (term.toLocaleLowerCase() === 'continue') {
    const watchProgressService = injector.getInstance(WatchProgressService)

    const { entries: lastEntries } = await watchProgressService.findWatchProgress({
      top: 3,
      order: { updatedAt: 'DESC' },
    })
    if (lastEntries.length) {
      const movieFilesService = injector.getInstance(MovieFilesService)
      const moviesService = injector.getInstance(MoviesService)

      const movieFiles = await movieFilesService.findMovieFile({
        filter: {
          id: {
            $in: lastEntries.map((e) => e.movieFileId),
          },
        },
      })

      const movies = movieFiles.entries.some((e) => e.imdbId)
        ? await moviesService.findMovie({
            filter: {
              imdbId: {
                $in: movieFiles.entries.map((e) => e.imdbId as string),
              },
            },
          })
        : { entries: [] }
      await movieFilesService.prefetchMovieFilesForMovies(movies.entries)

      return [
        {
          score: 1,
          element: (
            <WidgetGroup
              title="Continue watching"
              type="group"
              widgets={movieFiles.entries.map((entry, index) => ({
                type: 'movie',
                imdbId: entry.imdbId as string,
                index,
                size: 128,
              }))}
            />
          ),
          onSelected: () => {
            /** */
          },
        },
      ]
    }
  }

  return []
}
