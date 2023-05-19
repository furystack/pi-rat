import type { CommandProvider } from '@furystack/shades-common-components'
import { SeriesService } from '../../../services/series-service.js'
import { createSuggestion } from './create-suggestion.js'
import { navigateToRoute } from '../../../navigate-to-route.js'
import { seriesOverviewRoute } from '../../routes/movie-routes.js'
import { createComponent } from '@furystack/shades'

export const searchSeriesCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (term.length > 4) {
    const seriesService = injector.getInstance(SeriesService)
    const relatedSeries = await seriesService.findSeries({
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
          {
            plot: {
              $like: `%${term}%`,
            },
          },
        ],
      },
    })
    return relatedSeries.entries.map((series) =>
      createSuggestion({
        icon: series.thumbnailImageUrl ? (
          <img src={series.thumbnailImageUrl} alt={series.title} style={{ height: '64px', marginRight: '16px' }} />
        ) : (
          '🎥'
        ),
        name: series.title,
        description: series.plot,
        score: 5,
        onSelected: () => {
          navigateToRoute(injector, seriesOverviewRoute, { imdbId: series.imdbId })
        },
      }),
    )
  }

  return []
}
