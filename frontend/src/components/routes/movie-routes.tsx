import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { MovieList } from '../../pages/movies/movie-list.js'
import type { MatchResult } from 'path-to-regexp'
import { MoviePlayer } from '../../pages/movies/movie-player.js'
import { MovieOverview } from '../../pages/movies/movie-overview.js'

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

const seriesOverviewRoute = {
  url: '/series/:imdbId/overview',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <>Overview series with imdb id {match.params.imdbId}</>
  },
}

export const movieRoutes = [movieListRoute, watchMovieRoute, movieOverviewRoute, seriesOverviewRoute] as const
