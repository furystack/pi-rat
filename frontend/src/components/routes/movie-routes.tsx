import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { MovieList } from '../../pages/movies/movie-list.js'
import type { MatchResult } from 'path-to-regexp'

export const movieListRoute = {
  url: '/movies',
  onVisit,
  onLeave,
  component: () => {
    return <MovieList />
  },
} as const

export const watchMovieRoute = {
  url: '/movies/:imdbId',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => {
    return <>Watch movie with imdb id {match.params.imdbId}</>
  },
}

export const movieRoutes = [movieListRoute] as const

export type MovieUrl = (typeof movieRoutes)[number]['url']
