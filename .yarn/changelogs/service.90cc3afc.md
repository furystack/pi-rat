<!-- version-type: patch -->

# service

## ✨ Features

### TMDB Client Service

Added `TmdbClientService` with support for searching and fetching movie/series details from the TMDB API, including multi-language metadata retrieval based on the configured `TmdbConfig` languages.

### Configurable Metadata Provider Chain

The movie-linking pipeline now supports a configurable provider priority (`omdb`, `tmdb`) via `MetadataProviderConfig`. Providers are tried in order; the first one to return a result wins.

### IMDB ID Extraction from Files

- Added `extractImdbIdFromNfoFiles()` — scans `.nfo` files in the parent directory for IMDB IDs (e.g. `tt1234567`), enabling direct metadata lookup without a search API call
- Added `extractImdbIdFromFfprobeTags()` — extracts IMDB IDs from ffprobe format tags (`imdb_id`, `imdb-id`, `imdb`, etc.)

### Localized Metadata Storage

- Added `ensureMovieLocalizedMetadataExists()` and `ensureSeriesLocalizedMetadataExists()` for upserting per-language metadata records
- Added `mapOmdbMovieToLocalized()` / `mapOmdbSeriesToLocalized()` to convert OMDB metadata into localized format (English only)
- Added `mapTmdbMovieToLocalized()` / `mapTmdbSeriesToLocalized()` to convert TMDB responses into localized format for any language

### HLS Start-Time Seeking

- Transcoding sessions now accept a `startTime` parameter, using FFmpeg input seeking (`-ss` before `-i`) to start transcoding from an arbitrary position
- Added `padPlaylistToFullDuration()` to pad HLS playlists for correct total duration when segments don't cover the full file

### Other

- Added `removeAllSessionsForFile()` to tear down every active transcoding session for a given file path
- Added 4K (3840x2160) resolution variant to the HLS manifest generator
- Added `TmdbMovieMetadata`, `TmdbSeriesMetadata`, `MovieMetadataLocalized`, and `SeriesMetadataLocalized` data sets and API endpoints
- Added TMDB status check to the service status endpoint

## 🐛 Bug Fixes

- Fixed HLS session teardown to remove all sessions for a file instead of requiring exact mode/resolution/audioTrack match

## ♻️ Refactoring

### `setup-media.ts` Split

Extracted the monolithic `setup-media.ts` into focused modules:

- `media-sequelize-models.ts` — Sequelize model definitions for all media entities
- `media-data-sets.ts` — Repository data set registration
- `media-schema-setup.ts` — Database schema setup and sync
- `announce-movie-file-added.ts` — WebSocket notification when movie files are added

### Link-Movie Provider Architecture

Refactored `link-movie.ts` from a single OMDB-only flow into a provider-based architecture with `tryOmdbProvider()` and `tryTmdbProvider()` functions, plus an `enrichMetadataFromProviders()` step that fetches additional localized metadata after initial linking.

## 🧪 Tests

- Added tests for `TmdbClientService` covering search, detail fetching, multi-language support, and error/rate-limit handling
- Added tests for `extractImdbIdFromNfoFiles()` and `extractImdbIdFromFfprobeTags()`
- Added tests for `ensureMovieLocalizedMetadataExists()` and `ensureSeriesLocalizedMetadataExists()`
- Added tests for `mapOmdbMovieToLocalized()` and `mapTmdbMovieToLocalized()` / `mapTmdbSeriesToLocalized()`
- Added tests for `ensureTmdbMovieExists()` and `ensureTmdbSeriesExists()`
- Added tests for `HlsManifestGenerator` including 4K variant and `startTime` / `audioTrack` pass-through
- Added tests for `HlsStreamAction` start-time parameter handling
- Updated `TranscodingSession` tests for start-time seeking and playlist padding
- Updated `link-movie` tests for provider chain, NFO extraction, and TMDB fallback
- Updated `HlsSessionTeardownAction` tests for `removeAllSessionsForFile()` behavior
