import { createComponent } from '@furystack/shades'
import type { MatchResult } from 'path-to-regexp'
import { MovieList } from '../../pages/movies/movie-list.js'
import { MovieLoader } from '../../pages/movies/movie-loader.js'
import { MovieOverview } from '../../pages/movies/movie-overview.js'
import { SeriesList } from '../../pages/movies/series-list.js'
import { SeriesOverview } from '../../pages/movies/series-overview.js'

export const movieListRoute = {
  url: '/movies',
  component: () => {
    return <MovieList />
  },
}

export const watchMovieRoute = {
  url: '/movies/:id/watch',
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <MovieLoader movieFileId={match.params.id} />
  },
}

export const movieOverviewRoute = {
  url: '/movies/:imdbId/overview',
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <MovieOverview imdbId={match.params.imdbId} />
  },
}

export const seriesListRoute = {
  url: '/series',
  component: () => <SeriesList />,
}

export const seriesOverviewRoute = {
  url: '/series/:imdbId',
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <SeriesOverview imdbId={match.params.imdbId} />
  },
}

export const movieRoutes = {
  [movieListRoute.url]: movieListRoute,
  [watchMovieRoute.url]: watchMovieRoute,
  [movieOverviewRoute.url]: movieOverviewRoute,
  [seriesListRoute.url]: seriesListRoute,
  [seriesOverviewRoute.url]: seriesOverviewRoute,
}
