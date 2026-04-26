import { defineService, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
import { execAsync } from '../../../utils/exec-async.js'

export type HwAccelMethod = 'vaapi' | 'nvenc' | 'qsv' | 'videotoolbox' | 'none'

export type HwAccelInfo = {
  available: HwAccelMethod[]
  encoders: Record<string, string[]>
}

const ENCODER_MAP: Record<HwAccelMethod, { h264?: string; hevc?: string }> = {
  vaapi: { h264: 'h264_vaapi', hevc: 'hevc_vaapi' },
  nvenc: { h264: 'h264_nvenc', hevc: 'hevc_nvenc' },
  qsv: { h264: 'h264_qsv', hevc: 'hevc_qsv' },
  videotoolbox: { h264: 'h264_videotoolbox', hevc: 'hevc_videotoolbox' },
  none: {},
}

export interface HwAccelDetector {
  detect(): Promise<HwAccelInfo>
  getEncoder(codec: 'h264' | 'hevc', preferredMethod?: HwAccelMethod): Promise<string>
}

export const HwAccelDetector: Token<HwAccelDetector, 'singleton'> = defineService({
  name: 'pi-rat/HwAccelDetector',
  lifetime: 'singleton',
  factory: (ctx) => {
    const logger = useScopedLogger(ctx)
    let cachedInfo: HwAccelInfo | null = null

    const detect = async (): Promise<HwAccelInfo> => {
      if (cachedInfo) return cachedInfo

      const available: HwAccelMethod[] = []
      const encoders: Record<string, string[]> = {}

      try {
        const hwaccelsOutput = await execAsync('ffmpeg -hwaccels 2>/dev/null', {})
        const lines = hwaccelsOutput.trim().split('\n').slice(1)

        const methodMap: Record<string, HwAccelMethod> = {
          vaapi: 'vaapi',
          cuda: 'nvenc',
          qsv: 'qsv',
          videotoolbox: 'videotoolbox',
        }

        for (const line of lines) {
          const method = methodMap[line.trim()]
          if (method) available.push(method)
        }

        void logger.information({
          message: `Detected hardware acceleration methods: ${available.join(', ') || 'none'}`,
        })
      } catch {
        void logger.verbose({ message: 'Could not detect hardware acceleration methods' })
      }

      try {
        const encodersOutput = await execAsync('ffmpeg -encoders 2>/dev/null', {})
        const encoderLines = encodersOutput.trim().split('\n')

        const hwEncoderNames = Object.values(ENCODER_MAP).flatMap((m) => Object.values(m))

        for (const line of encoderLines) {
          const match = line.match(/^\s*V\S*\s+(\S+)/)
          if (match && hwEncoderNames.includes(match[1])) {
            const codec = match[1].includes('h264') ? 'h264' : match[1].includes('hevc') ? 'hevc' : 'unknown'
            if (!encoders[codec]) encoders[codec] = []
            encoders[codec].push(match[1])
          }
        }
      } catch {
        void logger.verbose({ message: 'Could not detect available encoders' })
      }

      cachedInfo = { available, encoders }
      return cachedInfo
    }

    const getEncoder = async (codec: 'h264' | 'hevc', preferredMethod?: HwAccelMethod): Promise<string> => {
      const info = await detect()

      if (preferredMethod && preferredMethod !== 'none' && info.available.includes(preferredMethod)) {
        const encoder = ENCODER_MAP[preferredMethod]?.[codec]
        if (encoder) return encoder
      }

      for (const method of info.available) {
        const encoder = ENCODER_MAP[method]?.[codec]
        if (encoder && info.encoders[codec]?.includes(encoder)) {
          return encoder
        }
      }

      return codec === 'h264' ? 'libx264' : 'libx265'
    }

    return { detect, getEncoder }
  },
})
