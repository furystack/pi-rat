import { Shade, createComponent } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'

/**
 * Minimal HLS player for debugging — no media-chrome, no MoviePlayerService,
 * no watch progress, no audio/subtitle track management. Just hls.js + a <video>.
 */
export const PlainHlsPlayer = Shade<{ driveLetter: string; path: string }>({
  shadowDomName: 'plain-hls-player',
  render: ({ props, useDisposable, useRef }) => {
    const videoRef = useRef<HTMLVideoElement>('video')
    const logRef = useRef<HTMLPreElement>('log')

    const hlsUrl = `${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(props.driveLetter)}/${encodeURIComponent(props.path)}/master.m3u8`

    useDisposable('hls-setup', () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      const frameId = requestAnimationFrame(async () => {
        const video = videoRef.current
        const log = logRef.current
        if (!video || !log) return

        const append = (msg: string) => {
          const line = `[${new Date().toISOString().slice(11, 23)}] ${msg}\n`
          log.textContent += line
          log.scrollTop = log.scrollHeight
        }

        append(`HLS URL: ${hlsUrl}`)

        const HlsModule = (await import('hls.js')).default

        if (!HlsModule.isSupported()) {
          append('hls.js not supported, trying native')
          video.src = hlsUrl
          return
        }

        const hls = new HlsModule({
          debug: false,
          xhrSetup: (xhr) => {
            xhr.withCredentials = true
          },
        })

        hls.on(HlsModule.Events.MANIFEST_PARSED, (_e, data) => {
          append(`Manifest parsed: ${data.levels.length} levels`)
          video.play().catch((err) => append(`Autoplay blocked: ${err}`))
        })

        hls.on(HlsModule.Events.LEVEL_LOADED, (_e, data) => {
          append(
            `Level ${data.level} loaded: ${data.details.totalduration?.toFixed(1)}s, ${data.details.fragments.length} frags`,
          )
        })

        hls.on(HlsModule.Events.FRAG_LOADED, (_e, data) => {
          append(
            `Frag ${data.frag.sn} loaded (${data.frag.start.toFixed(1)}-${(data.frag.start + data.frag.duration).toFixed(1)}s)`,
          )
        })

        hls.on(HlsModule.Events.ERROR, (_e, data) => {
          append(`ERROR: ${data.type} / ${data.details}${data.fatal ? ' [FATAL]' : ''}`)
          if (data.fatal && data.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
            append('Attempting recovery...')
            hls.recoverMediaError()
          }
        })

        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
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
