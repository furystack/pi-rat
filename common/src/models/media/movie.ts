export class Movie {
  id!: string
  movieLibraryId!: string
  path!: string
  title!: string
  imdbId?: string
  year?: number
  duration?: number
  genre?: string[]
  thumbnailImageUrl?: string
  plot?: string
  type?: 'movie' | 'episode'
  seriesId?: string
  season?: number
  episode?: number
}
