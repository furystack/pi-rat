export class TmdbMovieMetadata {
  public id!: number
  public imdbId?: string
  public title!: string
  public originalTitle!: string
  public overview!: string
  public releaseDate?: string
  public runtime?: number
  public posterPath?: string
  public backdropPath?: string
  public genres!: Array<{ id: number; name: string }>
  public voteAverage?: number
  public voteCount?: number
  public popularity?: number
  public originalLanguage!: string
  public spokenLanguages?: Array<{ iso_639_1: string; name: string }>
  public productionCountries?: Array<{ iso_3166_1: string; name: string }>
  public status?: string
  public tagline?: string
  public budget?: number
  public revenue?: number
  public language!: string
  public createdAt!: string
  public updatedAt!: string
}
