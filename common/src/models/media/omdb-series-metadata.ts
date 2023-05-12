export class OmdbSeriesMetadata {
  public Title!: string //'Supernatural'
  public Year!: string // '2005–2020'
  public Rated!: string // 'TV-14'
  public Released!: string // '13 Sep 2005'
  public Runtime!: string // '44 min'
  public Genre!: string // 'Drama, Fantasy, Horror'
  public Director!: string // 'N/A'
  public Writer!: string // 'Eric Kripke'
  public Actors!: string // 'Jared Padalecki, Jensen Ackles, Jim Beaver'
  public Plot!: string // "Two brothers follow their father's footsteps as hunters, fighting evil supernatural beings of many kinds, including monsters, demons and gods that roam the earth."
  public Language!: string // 'English'
  public Country!: string // 'United States, Canada'
  public Awards!: string //  'Nominated for 3 Primetime Emmys. 37 wins & 127 nominations total'
  public Poster!: string // 'https://m.media-amazon.com/images/M/MV5BNzRmZWJhNjUtY2ZkYy00N2MyLWJmNTktOTAwY2VkODVmOGY3XkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg'
  public Ratings!: Array<{
    Source: string //  'Internet Movie Database'
    Value: string //  '8.4/10'
  }>
  public Metascore!: string // 'N/A'
  public imdbRating!: string // '8.4'
  public imdbVotes!: string // '410,560'
  public imdbId!: string // 'tt0460681'
  public Type!: string // 'series'
  public totalSeasons!: string // '15'
  public Response!: string //  'True'
  createdAt!: string
  updatedAt!: string
}
