<!-- version-type: minor -->

# service

## ✨ Features

### Add server-driven playback mode engine

- Add `StreamBuilder` service resolving optimal playback mode (direct-play / remux / direct-stream / transcode) from ffprobe data and client codec support
- Add `-c:v copy` / `-c:a copy` support to FFmpeg args builder for remux and direct-stream modes

### Add HLS streaming endpoints

- Add master playlist generation (`master.m3u8`) with adaptive bitrate variants and audio/subtitle renditions
- Add media playlist generation (`stream.m3u8`) with VOD segment listing
- Add segment serving endpoint (`segment/:index`) with cache-first lookup and FFmpeg fallback

### Add subtitle API

- Implement `GET /movies/:movieId/subtitles` and `GET /movies/:movieId/subtitles/:subtitleName`
- Expand subtitle extraction to handle SRT, ASS/SSA, mov_text, and WebVTT formats
- Classify PGS/VobSub bitmap subtitles as burn-in-required in playback-info

### Add transcoding infrastructure

- Add `TranscodingSessionService` for managing FFmpeg processes with idle timeout cleanup
- Add `SegmentCache` with SHA-256 keying, disk persistence, and LRU eviction
- Add `HwAccelDetector` with cached probe of `ffmpeg -hwaccels` and `-encoders`
- Add expanded output codec support: H.265, VP9, AV1

### Add input validation for HLS endpoints

- Add `Validate()` wrappers for all HLS endpoints (master, stream, segment)
- Add explicit validation for segment index, time range, playback mode, and resolution parameters
- Add path traversal prevention in subtitle file serving

## 🧪 Tests

- Add unit tests for stream builder decision logic covering all 4 modes
- Add unit tests for FFmpeg args builder with remux, direct-stream, and transcode modes
- Add unit tests for HLS manifest generation (master, media, subtitle playlists)
- Add unit tests for segment cache including LRU eviction
- Add unit tests for transcoding session management
- Add unit tests for hardware acceleration detection
- Add unit tests for subtitle extraction and subtitle API actions
- Add input validation tests for HLS segment and stream actions
