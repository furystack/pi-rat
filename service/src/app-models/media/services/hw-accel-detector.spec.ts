import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { HwAccelDetector } from './hw-accel-detector.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const mockExecAsync = vi.fn()

vi.mock('../../../utils/exec-async.js', () => ({
  execAsync: (...args: unknown[]) => mockExecAsync(...args) as unknown,
}))

describe('HwAccelDetector', () => {
  it('should detect vaapi from ffmpeg output', async () => {
    mockExecAsync
      .mockResolvedValueOnce('Hardware acceleration methods:\nvaapi\ncuda\n')
      .mockResolvedValueOnce(
        ' V..... h264_vaapi           H.264/AVC (VAAPI) (codec h264)\n V..... hevc_vaapi           H.265/HEVC (VAAPI) (codec hevc)\n',
      )

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)
      const info = await detector.detect()

      expect(info.available).toContain('vaapi')
      expect(info.available).toContain('nvenc')
      expect(info.encoders.h264).toContain('h264_vaapi')
    })
  })

  it('should return empty lists when ffmpeg fails', async () => {
    mockExecAsync.mockRejectedValue(new Error('ffmpeg not found'))

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)
      const info = await detector.detect()

      expect(info.available).toHaveLength(0)
      expect(Object.keys(info.encoders)).toHaveLength(0)
    })
  })

  it('should cache detection results', async () => {
    mockExecAsync.mockReset()
    mockExecAsync
      .mockResolvedValueOnce('Hardware acceleration methods:\nvaapi\n')
      .mockResolvedValueOnce(' V..... h264_vaapi           H.264/AVC (VAAPI)\n')

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)

      const first = await detector.detect()
      const second = await detector.detect()

      expect(first).toBe(second)
      expect(mockExecAsync).toHaveBeenCalledTimes(2)
    })
  })

  it('should return software fallback when no hw encoder available', async () => {
    mockExecAsync.mockResolvedValueOnce('Hardware acceleration methods:\n').mockResolvedValueOnce('')

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)
      const encoder = await detector.getEncoder('h264')

      expect(encoder).toBe('libx264')
    })
  })

  it('should return hevc software fallback', async () => {
    mockExecAsync.mockResolvedValueOnce('Hardware acceleration methods:\n').mockResolvedValueOnce('')

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)
      const encoder = await detector.getEncoder('hevc')

      expect(encoder).toBe('libx265')
    })
  })

  it('should prefer specified hw method when available', async () => {
    mockExecAsync
      .mockResolvedValueOnce('Hardware acceleration methods:\nvaapi\ncuda\n')
      .mockResolvedValueOnce(
        ' V..... h264_vaapi           H.264/AVC (VAAPI)\n V..... h264_nvenc           H.264 (NVENC)\n',
      )

    await usingAsync(new Injector(), async (injector) => {
      const detector = injector.getInstance(HwAccelDetector)
      const encoder = await detector.getEncoder('h264', 'vaapi')

      expect(encoder).toBe('h264_vaapi')
    })
  })
})
