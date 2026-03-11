export class TmdbSeriesMetadata {
  public id!: number
  public imdbId?: string
  public name!: string
  public originalName!: string
  public overview!: string
  public firstAirDate?: string
  public posterPath?: string
  public backdropPath?: string
  public genres!: Array<{ id: number; name: string }>
  public voteAverage?: number
  public voteCount?: number
  public numberOfSeasons?: number
  public numberOfEpisodes?: number
  public status?: string
  public originalLanguage!: string
  public languages?: string[]
  public language!: string
  public createdAt!: string
  public updatedAt!: string
}
