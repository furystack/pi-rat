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
      const moviesService = injector.getInstance(MoviesService)
      const movies = await moviesService.findMovie({
        filter: {
          imdbId: {
            $in: lastEntries.map((e) => e.imdbId),
          },
        },
      })
      const movieFilesService = injector.getInstance(MovieFilesService)
      await movieFilesService.prefetchMovieFilesForMovies(movies.entries)

      return [
        {
          score: 1,
          element: (
            <WidgetGroup
              title="Continue watching"
              type="group"
              widgets={lastEntries.map((entry, index) => ({ type: 'movie', imdbId: entry.imdbId, index, size: 128 }))}
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
