export type MetadataFetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'not-configured' }
  | { status: 'error'; error: unknown }
