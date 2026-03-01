import { Shade, createComponent } from '@furystack/shades'
import type Hls from 'hls.js'
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

    const hlsUrl = `${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(props.driveLetter)}/${encodeURIComponent(props.path)}/master.m3u8?mode=transcode`

    let hlsInstance: Hls | null = null

    useDisposable('hls-setup', () => {
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

        void import('hls.js').then(({ default: HlsModule }) => {
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
          hlsInstance = hls

          hls.on(HlsModule.Events.MANIFEST_PARSED, (_e, data) => {
            append(`Manifest parsed: ${data.levels.length} levels`)
            video.play().catch((err: unknown) => append(`Autoplay blocked: ${String(err)}`))
          })

          hls.on(HlsModule.Events.LEVEL_LOADED, (_e, data) => {
            append(
              `Level ${data.level} loaded: ${data.details.totalduration?.toFixed(1)}s, ${data.details.fragments.length} frags`,
            )
          })

          hls.on(HlsModule.Events.FRAG_LOADED, (_e, data) => {
            const f = data.frag
            append(`Frag ${f.sn} [${f.type}] start=${f.start.toFixed(1)} dur=${f.duration.toFixed(1)} level=${f.level}`)
          })

          hls.on(HlsModule.Events.FRAG_BUFFERED, (_e, data) => {
            const { startPTS, endPTS } = data.frag
            if (startPTS !== undefined && startPTS !== null) {
              append(
                `  -> buffered ${data.frag.sn} [${data.frag.type}] PTS=${startPTS.toFixed(2)}-${endPTS?.toFixed(2)}`,
              )
            }
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
      })
      return {
        [Symbol.dispose]: () => {
          cancelAnimationFrame(frameId)
          if (hlsInstance) {
            hlsInstance.destroy()
            hlsInstance = null
          }
        },
      }
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
