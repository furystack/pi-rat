import { Shade, createComponent } from '@furystack/shades'

import { environmentOptions } from '../../utils/environment-options.js'

/**
 * Minimal HLS player for debugging -- native browser HLS playback + a <video>.
 * No MoviePlayerService, no watch progress, no audio/subtitle track management.
 */
export const PlainHlsPlayer = Shade<{ driveLetter: string; path: string }>({
  customElementName: 'plain-hls-player',
  render: ({ props, useDisposable, useRef }) => {
    const videoRef = useRef<HTMLVideoElement>('video')
    const logRef = useRef<HTMLPreElement>('log')

    const hlsUrl = `${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(props.driveLetter)}/${encodeURIComponent(props.path)}/master.m3u8?mode=transcode`

    useDisposable('video-setup', () => {
      const frameId = requestAnimationFrame(() => {
        const video = videoRef.current
        const log = logRef.current
        if (!video || !log) return

        const append = (msg: string) => {
          const line = `[${new Date().toISOString().slice(11, 23)}] ${msg}\n`
          log.textContent += line
          log.scrollTop = log.scrollHeight
        }

        append(`HLS URL: ${hlsUrl}`)
        video.src = hlsUrl

        video.addEventListener('loadedmetadata', () => {
          append(`Metadata loaded: duration=${video.duration.toFixed(1)}s`)
        })
        video.addEventListener('canplay', () => {
          append('Can play')
          video.play().catch((err: unknown) => append(`Autoplay blocked: ${String(err)}`))
        })
        video.addEventListener('error', () => {
          const err = video.error
          append(`ERROR: ${err?.message ?? `code ${err?.code}`}`)
        })
        video.addEventListener('progress', () => {
          if (video.buffered.length > 0) {
            const end = video.buffered.end(video.buffered.length - 1)
            append(`Buffered to ${end.toFixed(1)}s`)
          }
        })
        video.addEventListener('waiting', () => append('Waiting for data...'))
        video.addEventListener('playing', () => append('Playing'))
      })
      return { [Symbol.dispose]: () => cancelAnimationFrame(frameId) }
    })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: '#0f0' }}>
        <video
          ref={videoRef}
          controls
          autoplay
          style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
          crossOrigin="use-credentials"
        />
        <pre
          ref={logRef}
          style={{
            flex: '1',
            overflow: 'auto',
            margin: '0',
            padding: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#111',
            color: '#0f0',
            maxHeight: '30vh',
          }}
        >
          {'Plain HLS Player (debug)\n'}
        </pre>
      </div>
    )
  },
})
