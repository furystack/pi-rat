import type { PartialElement } from '@furystack/shades'
import 'hls-video-element'
import type { HlsVideoElement } from 'hls-video-element'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'hls-video': PartialElement<HlsVideoElement>
    }
  }
}
