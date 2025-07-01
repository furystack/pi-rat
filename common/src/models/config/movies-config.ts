export interface MoviesConfig {
  id: 'MOVIES_CONFIG'
  value: {
    /**
     * If true, the subtitles from the movie file will be extracted automatically on discovery
     */
    autoExtractSubtitles?: boolean

    /**
     * If true, all movies on all drives will be synced on startup or config change.
     */
    fullSyncOnStartup?: boolean

    /**
     * The default preset for transcoding movies.
     */
    preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'

    /**
     * The number of threads to use for transcoding.
     */
    threads?: number

    /**
     * 'all' or a list of directories to watch for new movies and all subtitles will be extracted automatically.
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
