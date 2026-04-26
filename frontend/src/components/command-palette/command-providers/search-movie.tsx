import type { CommandProvider } from '@furystack/shades-common-components'
import { createSuggestion } from './create-suggestion.js'
import { navigateToRoute } from '../../../utils/navigate-to-route.js'
import { createComponent } from '@furystack/shades'
import { MediaApiClient } from '../../../services/api-clients/media-api-client.js'

export const searchMovieCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (term.length > 4) {
    const mediaApiClient = injector.get(MediaApiClient)
    const { result: relatedLocalized } = await mediaApiClient.call({
      method: 'GET',
      action: '/movie-metadata-localized',
      query: {
        findOptions: {
          filter: {
            title: { $like: `%${term}%` },
          },
        },
      },
    })
    return relatedLocalized.entries.map((entry) =>
      createSuggestion({
        icon: entry.posterUrl ? (
          <img src={entry.posterUrl} alt={entry.title} style={{ height: '64px', marginRight: '16px' }} />
        ) : (
          '🎥'
        ),
        name: entry.title,
        description: entry.plot || '',
        score: 5,
        onSelected: () => {
          navigateToRoute(injector, '/movies/:imdbId/overview', { imdbId: entry.movieImdbId })
        },
      }),
    )
  }

  return []
}
