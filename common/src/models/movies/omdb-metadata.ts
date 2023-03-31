export type FailedOmdbMetadata = {
  Response: 'False'
  Error: any
}

export type FetchedOmdbMetadata = {
  Title: string
  Year: string
  Rated: string //'PG-13'
  Released: string //'13 Jun 2008'
  Runtime: string //'112 min'
  Genre: string //'Action, Adventure, Sci-Fi'
  Director: string //'Louis Leterrier'
  Writer: string //'Zak Penn (screenplay), Zak Penn (screen story), Stan Lee (Marvel comic book), Jack Kirby (Marvel comic book)'
  Actors: string //'Edward Norton, Liv Tyler, Tim Roth, William Hurt'
  Plot: string //'Bruce Banner, a scientist on the run from the U.S. Government, must find a cure for the monster he turns into whenever he loses his temper.'
  Language: string //'English, Portuguese, Spanish'
  Country: string //'USA'
  Awards: string //'1 win & 8 nominations.'
  Poster: string //'https://m.media-amazon.com/images/M/MV5BMTUyNzk3MjA1OF5BMl5BanBnXkFtZTcwMTE1Njg2MQ@@._V1_SX300.jpg'
  Ratings: Array<{ Source: string; Value: string }>
  //[
  // {
  //   Source: 'Rotten Tomatoes'
  //   Value: '67%'
  // },
  // ...
  //]
  Metascore: string // '61'
  imdbRating: string // '6.7'
  imdbVotes: string // '422,380'
  imdbID: string // 'tt0800080'
  Type: 'movie' | 'episode' // 'movie'
  DVD?: string // 'N/A'
  BoxOffice?: string // 'N/A'
  Production?: string // 'N/A'
  Website?: string // 'N/A'
  Response: 'True'
  seriesID?: string
  Season?: string
  Episode?: string
}

export type OmdbMetadata = FailedOmdbMetadata | FetchedOmdbMetadata

export const isValidOmdbMetadata = (metadata: any): metadata is FetchedOmdbMetadata => {
  return metadata && metadata.Response === 'True' ? true : false
}
