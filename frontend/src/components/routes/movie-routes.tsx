import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { MovieList } from '../../pages/movies/movie-list.js'
import type { MatchResult } from 'path-to-regexp'
import { MoviePlayer } from '../../pages/movies/movie-player.js'
import { MovieOverview } from '../../pages/movies/movie-overview.js'
import { SeriesList } from '../../pages/movies/series-list.js'
import { SeriesOverview } from '../../pages/movies/series-overview.js'

export const movieListRoute = {
  url: '/movies',
  onVisit,
  onLeave,
  component: () => {
    return <MovieList />
  },
}

export const watchMovieRoute = {
  url: '/movies/:id/watch',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <MoviePlayer movieFileId={match.params.id} />
  },
}

export const movieOverviewRoute = {
  url: '/movies/:imdbId/overview',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <MovieOverview imdbId={match.params.imdbId} />
  },
}

export const seriesListRoute = {
  url: '/series',
  onVisit,
  onLeave,
  component: () => <SeriesList />,
}

export const seriesOverviewRoute = {
  url: '/series/:imdbId',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <SeriesOverview imdbId={match.params.imdbId} />
  },
}

export const movieRoutes = [
  movieListRoute,
  watchMovieRoute,
  movieOverviewRoute,
  seriesListRoute,
  seriesOverviewRoute,
] as const
