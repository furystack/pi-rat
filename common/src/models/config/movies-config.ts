export interface MoviesConfig {
  id: 'MOVIES_CONFIG'
  value: {
    /**
     * Search .nfo files for imdb id
     */
    enableNfoParsing: boolean

    /**
     * 'all' or a list of directories to watch for new movies.
     */
    watchFiles:
      | 'all'
      | Array<{
          /**
           * The drive to watch
           */
          drive: string
          /**
           * An optional path filter. If not set, all files in the drive will be watched.
           */
          path?: string
        }>
  }
}
