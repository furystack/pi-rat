export class SeriesMetadataLocalized {
  id!: string
  seriesImdbId!: string
  language!: string
  title!: string
  plot?: string
  posterUrl?: string
  source!: 'omdb' | 'tmdb'
  sourceId?: string
  createdAt!: string
  updatedAt!: string
}
