export class OmdbMovieMetadata {
  public Title!: string
  public Year!: string
  public Rated!: string //'PG-13'
  public Released!: string //'13 Jun 2008'
  public Runtime!: string //'112 min'
  public Genre!: string //'Action, Adventure, Sci-Fi'
  public Director!: string //'Louis Leterrier'
  public Writer!: string //'Zak Penn (screenplay), Zak Penn (screen story), Stan Lee (Marvel comic book), Jack Kirby (Marvel comic book)'
  public Actors!: string //'Edward Norton, Liv Tyler, Tim Roth, William Hurt'
  public Plot!: string //'Bruce Banner, a scientist on the run from the U.S. Government, must find a cure for the monster he turns into whenever he loses his temper.'
  public Language!: string //'English, Portuguese, Spanish'
  public Country!: string //'USA'
  public Awards!: string //'1 win & 8 nominations.'
  public Poster!: string //'https://m.media-amazon.com/images/M/MV5BMTUyNzk3MjA1OF5BMl5BanBnXkFtZTcwMTE1Njg2MQ@@._V1_SX300.jpg'
  public Ratings!: Array<{ Source: string; Value: string }>
  //[
  // {
  //   Source: 'Rotten Tomatoes'
  //   Value: '67%'
  // },
  // ...
  //]
  public Metascore!: string // '61'
  public imdbRating!: string // '6.7'
  public imdbVotes!: string // '422,380'
  public imdbID!: string // 'tt0800080'
  public Type!: 'movie' | 'episode' // 'movie'
  DVD?: string // 'N/A'
  BoxOffice?: string // 'N/A'
  Production?: string // 'N/A'
  Website?: string // 'N/A'
  public Response!: 'True'
  seriesID?: string
  Season?: string
  Episode?: string
}

export const isValidOmdbMetadata = (metadata: any): metadata is OmdbMovieMetadata => {
  return metadata && metadata.Response === 'True' ? true : false
}
