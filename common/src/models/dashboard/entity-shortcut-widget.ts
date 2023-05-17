export interface EntityShortcutWidget {
  type: 'entity-shortcut'
  entityName:
    | 'config'
    | 'dasboard'
    | 'drive'
    | 'user'
    | 'movie'
    | 'movie-file'
    | 'omdb-movie-metadata'
    | 'omdb-series-metadata'
}
