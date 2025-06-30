import type { PartialElement } from '@furystack/shades'
import 'media-chrome'
import type {
  MediaAirplayButton,
  MediaCaptionsButton,
  MediaCastButton,
  MediaChromeButton,
  MediaChromeDialog,
  MediaChromeRange,
  MediaContainer,
  MediaControlBar,
  MediaController,
  MediaDurationDisplay,
  MediaErrorDialog,
  MediaFullscreenButton,
  MediaGestureReceiver,
  MediaLiveButton,
  MediaLoadingIndicator,
  MediaMuteButton,
  MediaPipButton,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaPosterImage,
  MediaPreviewChapterDisplay,
  MediaPreviewThumbnail,
  MediaPreviewTimeDisplay,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTextDisplay,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaTooltip,
  MediaVolumeRange,
} from 'media-chrome'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'media-controller': PartialElement<MediaController>
      'media-play-button': PartialElement<MediaPlayButton>
      'media-airplay-button': PartialElement<MediaAirplayButton>
      'media-captions-button': PartialElement<MediaCaptionsButton>
      'media-cast-button': PartialElement<MediaCastButton>
      'media-chrome-button': PartialElement<MediaChromeButton>
      'media-chrome-dialog': PartialElement<MediaChromeDialog>
      'media-chrome-range': PartialElement<MediaChromeRange>
      'media-container': PartialElement<MediaContainer>
      'media-control-bar': PartialElement<MediaControlBar>
      'media-chrome': PartialElement<MediaController>
      'media-duration-display': PartialElement<MediaDurationDisplay>
      'media-error-dialog': PartialElement<MediaErrorDialog>
      'media-fullscreen-button': PartialElement<MediaFullscreenButton>
      'media-gesture-receiver': PartialElement<MediaGestureReceiver>
      'media-live-button': PartialElement<MediaLiveButton>
      'media-loading-indicator': PartialElement<MediaLoadingIndicator>
      'media-mute-button': PartialElement<MediaMuteButton>
      'media-pip-button': PartialElement<MediaPipButton>
      'media-poster-image': PartialElement<MediaPosterImage>
      'media-playback-rate-button': PartialElement<MediaPlaybackRateButton>
      'media-preview-chapter-display': PartialElement<MediaPreviewChapterDisplay>
      'media-preview-thumbnail': PartialElement<MediaPreviewThumbnail>
      'media-preview-time-display': PartialElement<MediaPreviewTimeDisplay>
      'media-seek-backward-button': PartialElement<MediaSeekBackwardButton>
      'media-seek-forward-button': PartialElement<MediaSeekForwardButton>
      'media-text-display': PartialElement<MediaTextDisplay>
      'media-time-display': PartialElement<MediaTimeDisplay>
      'media-time-range': PartialElement<MediaTimeRange>
      'media-tooltip': PartialElement<MediaTooltip>
      'media-volume-range': PartialElement<MediaVolumeRange>
    }
  }
}
