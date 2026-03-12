<!-- version-type: patch -->

# frontend

## ✨ Features

### TMDB Settings Page

Added admin settings page at `/settings/tmdb` for configuring TMDB API credentials, default language, and additional languages for metadata fetching.

### Localized Metadata Service

Added `LocalizedMetadataService` with caches for fetching `MovieMetadataLocalized` and `SeriesMetadataLocalized` by IMDB ID and language. Movie and series overview pages now display localized titles, plots, posters, and genres from this service.

### Movie Player Seeking and Quality Switching

- Added server-side seek support via `startTime` parameter — the player requests a new HLS session starting at the desired position when seeking outside the buffered range
- Added `switchResolution()` for changing playback quality mid-stream with optional full session reload
- Added `isSwitching` guard to avoid progress updates during resolution/audio/seek transitions

### Entity Browser Pages

- Added entity browser pages for `TmdbMovieMetadata` and `TmdbSeriesMetadata`

## 🐛 Bug Fixes

- Fixed movie duration not displaying correctly by preferring `playbackInfo.duration` over stream duration in seek bar
- Fixed legacy navigation issues by relocating route utilities to `utils/` directory

## ♻️ Refactoring

- Replaced `media-chrome` and `hls.js` dependencies with modular native player controls (`PlayButton`, `SeekBar`, `VolumeControl`, `SettingsMenu`, etc.) under `controls/` directory
- Moved video event binding and playback state (play/pause, volume, duration, buffered) into `MoviePlayerService` observables
- Extracted file context menu items into a pure `getContextMenuItems()` function, replacing the Shade-based `FileContextMenu` component
- Extracted file drag-and-drop upload logic into `handleFileDrop()` utility
- Extracted `SessionUserUnavailableError`, `getUser()`, and `hasRole()` into `utils/session-helpers.ts` for reusable session access
- Relocated `environment-options.ts`, `navigate-to-route.ts`, `trigger-download.ts`, and `theme-switch-cheat.tsx` into `utils/` directory
- Simplified `SessionService.currentUser` to store the full `User` object instead of a partial pick

## 🧪 Tests

- Added tests for `LocalizedMetadataService` cache behavior
- Added tests for `TmdbSettings` page form validation and config persistence
- Added tests for `session-helpers` utilities
- Updated `MoviePlayerService` tests for seeking, resolution switching, and start-time support
- Updated `MoviePlayerV2Component` tests for the new seeking and resolution switching behavior
