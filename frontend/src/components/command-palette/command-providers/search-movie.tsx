import type { CommandProvider } from '@furystack/shades-common-components'
import { createSuggestion } from './create-suggestion.js'
import { navigateToRoute } from '../../../navigate-to-route.js'
import { movieOverviewRoute } from '../../routes/movie-routes.js'
import { createComponent } from '@furystack/shades'
import { MoviesService } from '../../../services/movies-service.js'

export const searchMovieCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (term.length > 4) {
    const movieService = injector.getInstance(MoviesService)
    const relatedMovies = await movieService.findMovie({
      filter: {
        $or: [
          {
            title: {
              $like: `%${term}%`,
            },
          },
          {
            imdbId: {
              $like: `%${term}%`,
            },
          },
        ],
      },
    })
    return relatedMovies.entries.map((movie) =>
      createSuggestion({
        icon: movie.thumbnailImageUrl ? (
          <img src={movie.thumbnailImageUrl} alt={movie.title} style={{ height: '64px', marginRight: '16px' }} />
        ) : (
          '🎥'
        ),
        name: movie.title,
        description: movie.plot || '',
        score: 5,
        onSelected: () => {
          navigateToRoute(injector, movieOverviewRoute, { imdbId: movie.imdbId })
        },
      }),
    )
  }

  return []
}
