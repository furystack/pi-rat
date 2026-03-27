<!-- version-type: minor -->

# common

## ✨ Features

### TMDB Integration Models

- Added `TmdbMovieMetadata` model with fields for TMDB movie details including genres, vote data, production info, and multi-language support
- Added `TmdbSeriesMetadata` model with fields for TMDB series details including season/episode counts and language info
- Added `TmdbConfig` configuration type for TMDB API key, default language, and additional language preferences
- Added `MetadataProviderConfig` type to define an ordered priority list of metadata providers (`omdb` | `tmdb`)

### Localized Metadata Models

- Added `MovieMetadataLocalized` model for per-language movie metadata (title, plot, poster, genre) with source tracking (`omdb` | `tmdb`)
- Added `SeriesMetadataLocalized` model for per-language series metadata with source tracking

### Media API Endpoints

- Added REST endpoints for `TmdbMovieMetadata`, `TmdbSeriesMetadata`, `MovieMetadataLocalized`, and `SeriesMetadataLocalized` entity browsing
- Added `audioTrack` and `startTime` query parameters to HLS master, stream, segment, init, and teardown endpoints to support mid-stream seeking and audio track selection

### Other

- Added `HLS_SEGMENT_DURATION` constant (6 seconds) shared between frontend and service
- Extended `isMovieFile()` to recognize `.mp4` and `.mov` extensions
- Added `tmdb` field to `ServiceStatusResponse` for TMDB API availability checks

## ♻️ Refactoring

- Moved language-dependent fields (`title`, `plot`, `genre`, `thumbnailImageUrl`) from `Movie` and `Series` models into the new localized metadata models
- Renamed `omdb-not-configured` / `omdb-error` link statuses to `provider-not-configured` / `provider-error` to reflect multi-provider support
- Renamed `omdbNotConfigured` / `omdbError` scan progress fields to `providerNotConfigured` / `providerError`

## ⚠️ Breaking Changes

- `LinkMovie` response status strings `omdb-not-configured` and `omdb-error` have been renamed to `provider-not-configured` and `provider-error`
- `ScanProgress` fields `omdbNotConfigured` and `omdbError` have been renamed to `providerNotConfigured` and `providerError`
