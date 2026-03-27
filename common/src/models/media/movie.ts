export class Movie {
  imdbId!: string
  year?: number
  duration?: number
  type?: 'movie' | 'episode'
  seriesId?: string
  season?: number
  episode?: number
  createdAt!: string
  updatedAt!: string
}
