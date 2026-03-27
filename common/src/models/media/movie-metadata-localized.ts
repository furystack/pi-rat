export class MovieMetadataLocalized {
  id!: string
  movieImdbId!: string
  language!: string
  title!: string
  plot?: string
  posterUrl?: string
  genre?: string[]
  source!: 'omdb' | 'tmdb'
  sourceId?: string
  createdAt!: string
  updatedAt!: string
}
