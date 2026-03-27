export type TmdbConfig = {
  id: 'TMDB_CONFIG'
  value: {
    /**
     * The API key (v3 auth) or Read Access Token (v4 auth / Bearer) for the TMDB API.
     * Can be obtained at https://www.themoviedb.org/settings/api
     */
    apiKey: string
    /**
     * Primary language for metadata fetches, in TMDB locale format (e.g. 'en-US', 'fr-FR').
     */
    defaultLanguage: string
    /**
     * Additional languages to fetch alongside the default (e.g. ['fr-FR', 'de-DE']).
     */
    additionalLanguages: string[]
  }
}
