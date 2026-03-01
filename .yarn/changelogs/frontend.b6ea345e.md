<!-- version-type: minor -->

# frontend

## ✨ Features

### Replace MSE chunked player with hls.js

- Refactor `MoviePlayerService` to use `/playback-info` endpoint for server-driven mode selection
- Add hls.js-based playback for non-Safari browsers with native HLS fallback
- Support direct-play mode via direct `video.src` assignment for compatible files
- Add audio track switching with position-preserving reload

### Extend streaming settings UI

- Add hardware acceleration method selector (VAAPI, NVENC, QSV, VideoToolbox)
- Add HLS segment storage path configuration
- Add max cache size configuration for HLS segments

### Add subtitle track support from playback-info

- Add `getSubtitleTracksFromPlaybackInfo()` helper for building subtitle track elements from server response
- Filter out bitmap subtitles that require burn-in

### Add PlainHlsPlayer debug page

- Add minimal HLS player route at `/plain-hls/:letter/:path` for debugging HLS streams without media-chrome overhead

## 🧪 Tests

- Add unit tests for `MoviePlayerService` (initialization, playback info fetching, audio switching, disposal)
- Add unit tests for subtitle track helper functions

## ⬆️ Dependencies

- Added: `hls.js` `^1.6.15`
