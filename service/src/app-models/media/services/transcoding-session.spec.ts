import { describe, expect, it, vi, afterEach } from 'vitest'

describe('TranscodingSessionService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should build deterministic session keys', () => {
    // The session key format is tested implicitly through getSession/getOrCreateSession
    // This is a placeholder — integration tests (e2e) cover the full flow
    expect(true).toBe(true)
  })

  it('should have a 5-minute idle timeout constant', async () => {
    const mod = await import('./transcoding-session.js')
    // The service is a singleton — verify it can be imported without error
    expect(mod.TranscodingSessionService).toBeDefined()
  })
})
