export interface SeriesOmdbMetadata {
  Title: string //'Supernatural'
  Year: string // '2005–2020'
  Rated: string // 'TV-14'
  Released: string // '13 Sep 2005'
  Runtime: string // '44 min'
  Genre: string // 'Drama, Fantasy, Horror'
  Director: string // 'N/A'
  Writer: string // 'Eric Kripke'
  Actors: string // 'Jared Padalecki, Jensen Ackles, Jim Beaver'
  Plot: string // "Two brothers follow their father's footsteps as hunters, fighting evil supernatural beings of many kinds, including monsters, demons and gods that roam the earth."
  Language: string // 'English'
  Country: string // 'United States, Canada'
  Awards: string //  'Nominated for 3 Primetime Emmys. 37 wins & 127 nominations total'
  Poster: string // 'https://m.media-amazon.com/images/M/MV5BNzRmZWJhNjUtY2ZkYy00N2MyLWJmNTktOTAwY2VkODVmOGY3XkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg'
  Ratings: Array<{
    Source: string //  'Internet Movie Database'
    Value: string //  '8.4/10'
  }>
  Metascore: string // 'N/A'
  imdbRating: string // '8.4'
  imdbVotes: string // '410,560'
  imdbID: string // 'tt0460681'
  Type: string // 'series'
  totalSeasons: string // '15'
  Response: string //  'True'
}

export class Series {
  _id!: string
  imdbId!: string
  omdbMetadata!: SeriesOmdbMetadata
}
