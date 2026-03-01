<!-- version-type: minor -->

# common

## ✨ Features

### Add playback-info API and HLS streaming types

- Add `PlaybackInfoRequest` / `PlaybackInfoResponse` types with server-driven playback mode decision
- Add `PlaybackMode`, `CodecSupportMap`, `AudioTrackInfo`, `SubtitleTrackInfo` types
- Add `HlsMasterEndpoint`, `HlsStreamEndpoint`, `HlsSegmentEndpoint`, `HlsInitEndpoint` named types for HLS routes
- Add `GetSubtitlesEndpoint` and `GetSubtitleFileEndpoint` types for subtitle API
- Add `HlsSessionTeardownEndpoint` type for session cleanup
- Remove `StreamQueryParams` and `StreamFileEndpoint` types, replaced by HLS endpoint types
- Remove `/files/:letter/:path/stream` GET endpoint, replaced by HLS endpoints (`master.m3u8`, `stream.m3u8`, `init.mp4`, `segment/:index`)
- Extend `MoviesConfig` with `hlsSegmentPath`, `hlsMaxCacheSizeMb`, and `hwAccelMethod` settings
