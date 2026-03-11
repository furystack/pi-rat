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

  it('should call removeAllSessionsForFile and return success', async () => {
    const removeAllSessionsForFile = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { removeAllSessionsForFile } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      const result = await HlsSessionTeardownAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', audioTrack: 1, resolution: '720p' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(removeAllSessionsForFile).toHaveBeenCalledWith('A', 'test.mkv')
      expect(result).toEqual({
        chunk: { success: true },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      })
    })
  })

  it('should remove all sessions regardless of query params', async () => {
    const removeAllSessionsForFile = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { removeAllSessionsForFile } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsSessionTeardownAction({
        injector,
        getUrlParams: () => ({ letter: 'B', path: 'movie.mp4' }),
        getQuery: () => ({}),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(removeAllSessionsForFile).toHaveBeenCalledWith('B', 'movie.mp4')
    })
  })
})
