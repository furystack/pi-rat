import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const seriesRoutes = {
  '/series': {
    meta: { title: 'Series', icon: icons.film },
    component: ({ outlet }: { outlet?: JSX.Element }) =>
      outlet || (
        <PiRatLazyLoad
          component={async () => {
            const { SeriesList } = await import('../pages/movies/series-list.js')
            return <SeriesList />
          }}
        />
      ),
    children: {
      '/:imdbId': {
        meta: {
          title: ({ match }: TitleResolverOptions<{ imdbId: string }>): string => `Series ${match.params.imdbId}`,
          hidden: true,
        },
        component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => (
          <PiRatLazyLoad
            component={async () => {
              const { SeriesOverview } = await import('../pages/movies/series-overview.js')
              return <SeriesOverview imdbId={match.params.imdbId} />
            }}
          />
        ),
      },
    },
  },
}
