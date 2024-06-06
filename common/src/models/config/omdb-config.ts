export interface OmdbConfig {
  /**
   * Configuration entry for the OMDB API
   */
  id: 'OMDB_CONFIG'
  value: {
    /**
     * The API key for the OMDB API, can be requested at https://www.omdbapi.com/
     */
    apiKey: string
    /**
     * If a movie / series entry is added, try to search for the movie from data extracted from the file name (e.g.: title, year, season, episode, etc...)
     */
    trySearchMovieFromTitle: boolean
    /**
     * If a new imdb id is added, download the metadata automatically
     */
    autoDownloadMetadata: boolean
  }
}
