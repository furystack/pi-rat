export class Movie {
  imdbId!: string
  title!: string
  year?: number
  duration?: number
  genre?: string[]
  thumbnailImageUrl?: string
  plot?: string
  type?: 'movie' | 'episode'
  seriesId?: string
  season?: number
  episode?: number
  createdAt!: string
  updatedAt!: string
}
