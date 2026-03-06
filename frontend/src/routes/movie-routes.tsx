import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { decode } from 'common'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const movieRoutes = {
  '/movies': {
    meta: { title: 'Movies', icon: icons.film },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieList } = await import('../pages/movies/movie-list.js')
          return <MovieList />
        }}
      />
    ),
    children: {
      '/:id/watch': {
        meta: {
          title: ({ match }: TitleResolverOptions<{ id: string }>): string => `Watch ${match.params.id}`,
          icon: icons.play,
          hidden: true,
        },
        component: ({ match }: { match: MatchResult<{ id: string }> }) => (
          <PiRatLazyLoad
            component={async () => {
              const { MovieLoader } = await import('../pages/movies/movie-loader.js')
              return <MovieLoader movieFileId={match.params.id} />
            }}
          />
        ),
      },
      '/:imdbId/overview': {
        meta: {
          title: ({ match }: TitleResolverOptions<{ imdbId: string }>): string => `Movie ${match.params.imdbId}`,
          icon: icons.film,
          hidden: true,
        },
        component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => (
          <PiRatLazyLoad
            component={async () => {
              const { MovieOverview } = await import('../pages/movies/movie-overview.js')
              return <MovieOverview imdbId={match.params.imdbId} />
            }}
          />
        ),
      },
      '/': { component: () => <></>, routingOptions: { end: false } },
    },
  },
  '/hls-test/:driveLetter/:path': {
    meta: { title: 'HLS Test', hidden: true },
    component: ({ match }: { match: MatchResult<{ driveLetter: string; path: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { PlainHlsPlayer } = await import('../pages/movies/plain-hls-player.js')
          return <PlainHlsPlayer driveLetter={decode(match.params.driveLetter)} path={decode(match.params.path)} />
        }}
      />
    ),
  },
}
