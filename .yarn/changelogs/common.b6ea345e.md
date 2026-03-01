<!-- version-type: minor -->

# common

## ✨ Features

### Add playback-info API and HLS streaming types

- Add `PlaybackInfoRequest` / `PlaybackInfoResponse` types with server-driven playback mode decision
- Add `PlaybackMode`, `CodecSupportMap`, `AudioTrackInfo`, `SubtitleTrackInfo` types
- Add `HlsMasterEndpoint`, `HlsStreamEndpoint`, `HlsSegmentEndpoint`, `HlsInitEndpoint` named types for HLS routes
- Add `GetSubtitlesEndpoint` and `GetSubtitleFileEndpoint` types for subtitle API
- Extend `StreamQueryParams` with `mode` field for playback mode support
- Extend `MoviesConfig` with `hlsSegmentPath`, `hlsMaxCacheSizeMb`, and `hwAccelMethod` settings
