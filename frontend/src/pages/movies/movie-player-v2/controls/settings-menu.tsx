import { Shade, createComponent } from '@furystack/shades'
import { Icon, cssVariableTheme } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { gearIcon } from './player-icons.js'

type SettingsMenuProps = {
  mediaService: MoviePlayerService
}

type SubmenuId = 'speed' | 'audio' | 'captions' | null

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export const SettingsMenu = Shade<SettingsMenuProps>({
  customElementName: 'pirat-player-settings-menu',
  css: {
    position: 'relative',
    '& .settings-panel': {
      position: 'absolute',
      bottom: '100%',
      right: '0',
      marginBottom: '8px',
      background: cssVariableTheme.background.paper,
      borderRadius: '8px',
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      boxShadow: cssVariableTheme.shadows.lg,
      minWidth: '200px',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: '10',
    },
    '& .menu-item': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      color: cssVariableTheme.text.primary,
      border: 'none',
      background: 'none',
      width: '100%',
      textAlign: 'left',
    },
    '& .menu-item:hover': {
      background: cssVariableTheme.action.hoverBackground,
    },
    '& .menu-item.active': {
      color: cssVariableTheme.palette.primary.main,
    },
    '& .menu-header': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      fontSize: '14px',
      fontWeight: 'bold',
      color: cssVariableTheme.text.primary,
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      width: '100%',
      textAlign: 'left',
    },
  },
  render: ({ props, useObservable, useState }) => {
    const [isOpen, setIsOpen] = useState('isOpen', false)
    const [activeSubmenu, setActiveSubmenu] = useState<SubmenuId>('activeSubmenu', null)
    const [playbackRate] = useObservable('playbackRate', props.mediaService.playbackRate)
    const [activeTrack] = useObservable('activeTrack', props.mediaService.activeSubtitleTrack)

    const audioTracks = props.mediaService.getAudioTrackInfoFromPlaybackInfo()
    const ffprobeAudioTracks =
      audioTracks.length === 0
        ? props.mediaService.getAudioTracks().map((t) => ({
            index: t.id,
            label:
              (t.stream.tags as Record<string, string>)?.title ||
              (t.stream.tags as Record<string, string>)?.language ||
              'Audio Track',
            language: (t.stream.tags as Record<string, string>)?.language || 'unknown',
            codecName: t.codecName ?? 'unknown',
            channels: t.stream.channels ?? 2,
            isDefault: t.stream.disposition?.default === 1,
          }))
        : []
    const allAudioTracks = audioTracks.length > 0 ? audioTracks : ffprobeAudioTracks

    const subtitleTracks = props.mediaService.getSubtitleTrackInfoFromPlaybackInfo()

    const toggleMenu = () => {
      if (isOpen) {
        setIsOpen(false)
        setActiveSubmenu(null)
      } else {
        setIsOpen(true)
      }
    }

    const renderMainMenu = () => (
      <div className="settings-panel" data-testid="settings-menu-panel">
        <button className="menu-item" data-testid="settings-menu-item" onclick={() => setActiveSubmenu('speed')}>
          <span>Speed</span>
          <span style={{ opacity: '0.6' }}>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
        </button>
        {allAudioTracks.length > 1 && (
          <button className="menu-item" data-testid="settings-menu-item" onclick={() => setActiveSubmenu('audio')}>
            <span>Audio</span>
          </button>
        )}
        {subtitleTracks.length > 0 && (
          <button className="menu-item" data-testid="settings-menu-item" onclick={() => setActiveSubmenu('captions')}>
            <span>Captions</span>
            <span style={{ opacity: '0.6' }}>{activeTrack !== null ? 'On' : 'Off'}</span>
          </button>
        )}
      </div>
    )

    const renderSpeedSubmenu = () => (
      <div className="settings-panel" data-testid="settings-menu-panel">
        <button className="menu-header" onclick={() => setActiveSubmenu(null)}>
          ← Speed
        </button>
        {SPEED_OPTIONS.map((rate) => (
          <button
            className={`menu-item${playbackRate === rate ? ' active' : ''}`}
            onclick={() => {
              props.mediaService.setPlaybackRate(rate)
              setIsOpen(false)
              setActiveSubmenu(null)
            }}
          >
            {rate === 1 ? 'Normal' : `${rate}x`}
          </button>
        ))}
      </div>
    )

    const renderAudioSubmenu = () => (
      <div className="settings-panel" data-testid="settings-menu-panel">
        <button className="menu-header" onclick={() => setActiveSubmenu(null)}>
          ← Audio
        </button>
        {allAudioTracks.map((track, index) => (
          <button
            className={`menu-item${props.mediaService.audioTrackId.getValue() === track.index ? ' active' : ''}`}
            data-testid="audio-track-item"
            onclick={() => {
              void props.mediaService.switchAudioTrack(track.index)
              setIsOpen(false)
              setActiveSubmenu(null)
            }}
          >
            {track.label || track.language || `Audio Track ${index + 1}`}
          </button>
        ))}
      </div>
    )

    const renderCaptionsSubmenu = () => (
      <div className="settings-panel" data-testid="settings-menu-panel">
        <button className="menu-header" onclick={() => setActiveSubmenu(null)}>
          ← Captions
        </button>
        <button
          className={`menu-item${activeTrack === null ? ' active' : ''}`}
          data-testid="caption-track-item"
          onclick={() => {
            const video = props.mediaService.videoElement
            if (video) {
              for (const track of Array.from(video.textTracks)) {
                track.mode = 'hidden'
              }
            }
            props.mediaService.activeSubtitleTrack.setValue(null)
            setIsOpen(false)
            setActiveSubmenu(null)
          }}
        >
          Off
        </button>
        {subtitleTracks.map((track, index) => (
          <button
            className={`menu-item${activeTrack === index ? ' active' : ''}`}
            data-testid="caption-track-item"
            onclick={() => {
              const video = props.mediaService.videoElement
              if (video) {
                const textTracks = Array.from(video.textTracks).filter(
                  (t) => t.kind === 'subtitles' || t.kind === 'captions',
                )
                for (const t of textTracks) {
                  t.mode = 'hidden'
                }
                if (textTracks[index]) {
                  textTracks[index].mode = 'showing'
                }
              }
              props.mediaService.activeSubtitleTrack.setValue(index)
              setIsOpen(false)
              setActiveSubmenu(null)
            }}
          >
            {track.label || track.language || `Track ${index + 1}`}
          </button>
        ))}
      </div>
    )

    return (
      <>
        <button
          type="button"
          data-testid="settings-menu-button"
          title="Settings"
          onclick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon icon={gearIcon} />
        </button>
        {isOpen && (
          <>
            <div
              data-testid="settings-backdrop"
              style={{ position: 'fixed', inset: '0', zIndex: '5' }}
              onclick={() => {
                setIsOpen(false)
                setActiveSubmenu(null)
              }}
            />
            {activeSubmenu === null && renderMainMenu()}
            {activeSubmenu === 'speed' && renderSpeedSubmenu()}
            {activeSubmenu === 'audio' && renderAudioSubmenu()}
            {activeSubmenu === 'captions' && renderCaptionsSubmenu()}
          </>
        )}
      </>
    )
  },
})
