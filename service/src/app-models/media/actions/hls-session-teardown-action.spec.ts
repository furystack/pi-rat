import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { TranscodingSessionService } from '../services/transcoding-session.js'
import { HlsSessionTeardownAction } from './hls-session-teardown-action.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

describe('HlsSessionTeardownAction', () => {
  it('should reject path traversal attempts', async () => {
    await usingAsync(new Injector(), async (injector) => {
      try {
        await HlsSessionTeardownAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: '../etc/passwd' }),
          getQuery: () => ({ mode: 'transcode' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid path')
      }
    })
  })

  it('should reject invalid playback mode', async () => {
    await usingAsync(new Injector(), async (injector) => {
      try {
        await HlsSessionTeardownAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'invalid' as never }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid playback mode')
      }
    })
  })

  it('should call removeSession and return success', async () => {
    const removeSession = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance({ removeSession } as unknown as TranscodingSessionService, TranscodingSessionService)

      const result = await HlsSessionTeardownAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', audioTrack: 1, resolution: '720p' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(removeSession).toHaveBeenCalledWith('A', 'test.mkv', 'transcode', 1, '720p')
      expect(result).toEqual({
        chunk: { success: true },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      })
    })
  })

  it('should default mode to transcode and audioTrack to 0', async () => {
    const removeSession = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance({ removeSession } as unknown as TranscodingSessionService, TranscodingSessionService)

      await HlsSessionTeardownAction({
        injector,
        getUrlParams: () => ({ letter: 'B', path: 'movie.mp4' }),
        getQuery: () => ({}),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(removeSession).toHaveBeenCalledWith('B', 'movie.mp4', 'transcode', 0, undefined)
    })
  })
})
