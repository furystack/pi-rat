import type { PartialElement } from '@furystack/shades'
import 'media-chrome/all'
import type {
  MediaAirplayButton,
  MediaCaptionsButton,
  MediaCaptionsMenu,
  MediaCastButton,
  MediaChromeButton,
  MediaChromeDialog,
  MediaChromeMenu,
  MediaChromeMenuButton,
  MediaChromeMenuItem,
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
  MediaRenditionMenu,
  MediaRenditionMenuButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaSettingsMenu,
  MediaSettingsMenuButton,
  MediaSettingsMenuItem,
  MediaTextDisplay,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaTooltip,
  MediaVolumeRange,
} from 'media-chrome/all'

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
      'media-chrome-menu': PartialElement<MediaChromeMenu>
      'media-chrome-menu-button': PartialElement<MediaChromeMenuButton>
      'media-chrome-menu-item': PartialElement<MediaChromeMenuItem>
      'media-captions-menu': PartialElement<MediaCaptionsMenu>
      'media-settings-menu': PartialElement<MediaSettingsMenu>
      'media-settings-menu-button': PartialElement<MediaSettingsMenuButton>
      'media-settings-menu-item': PartialElement<MediaSettingsMenuItem>
      'media-rendition-menu': PartialElement<MediaRenditionMenu>
      'media-rendition-menu-button': PartialElement<MediaRenditionMenuButton>
      'media-audio-track-menu': PartialElement<MediaSettingsMenuItem>
      'media-playback-rate-menu': PartialElement<MediaSettingsMenuItem>
    }
  }
}
