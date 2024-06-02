export interface MoviesConfig {
  id: 'MOVIES_CONFIG'
  value: {
    /**
     * 'all' or a list of directories to watch for new movies.
     */
    watchFiles: 'all' | Array<{ drive: string; path: string }>
  }
}
