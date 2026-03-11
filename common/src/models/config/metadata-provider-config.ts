export interface MetadataProviderConfig {
  id: 'METADATA_PROVIDER_CONFIG'
  value: {
    /**
     * Ordered list of metadata providers to try when linking movies.
     * The first available provider that returns a result wins.
     */
    priority: Array<'omdb' | 'tmdb'>
  }
}
