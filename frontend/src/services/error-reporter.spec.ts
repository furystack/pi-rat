import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorReporter } from './error-reporter.js'

describe('ErrorReporter', () => {
  let windowOpenSpy: ReturnType<typeof vi.fn>
  let originalWindowOpen: typeof window.open

  beforeEach(() => {
    originalWindowOpen = window.open
    windowOpenSpy = vi.fn()
    window.open = windowOpenSpy as never
  })

  afterEach(() => {
    window.open = originalWindowOpen
  })

  it('should open GitHub issue with error details', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Test error message')
      error.stack = 'Error: Test error message\n  at test.ts:1:1'

      errorReporter.sendErrorReport(error)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      expect(callArg).toContain('http://github.com/furystack/pi-rat/issues/new')
      expect(callArg).toContain('title=')
      expect(callArg).toContain(encodeURIComponent('Automated Bug Report - Test error message'))
      expect(callArg).toContain('body=')
      expect(callArg).toContain('labels=bug')
    })
  })

  it('should include error stack in issue body', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Stack trace test')
      error.stack = 'Error: Stack trace test\n  at function1\n  at function2'

      errorReporter.sendErrorReport(error)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      const decodedBody = decodeURIComponent(callArg.split('body=')[1].split('&')[0])

      expect(decodedBody).toContain('Error: Stack trace test')
      expect(decodedBody).toContain('at function1')
      expect(decodedBody).toContain('at function2')
    })
  })

  it('should include custom context when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Context test')
      const context = 'User was trying to upload a file'

      errorReporter.sendErrorReport(error, context)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      const decodedBody = decodeURIComponent(callArg.split('body=')[1].split('&')[0])

      expect(decodedBody).toContain('User was trying to upload a file')
    })
  })

  it('should use default "none" when no context provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('No context test')

      errorReporter.sendErrorReport(error)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      const decodedBody = decodeURIComponent(callArg.split('body=')[1].split('&')[0])

      expect(decodedBody).toContain('## Additional Context')
      expect(decodedBody).toContain('none')
    })
  })

  it('should use custom repository when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Custom repo test')
      const customRepo = 'https://github.com/custom/repo'

      errorReporter.sendErrorReport(error, undefined, customRepo)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      expect(callArg).toContain('https://github.com/custom/repo/issues/new')
    })
  })

  it('should include app version, build date, and commit hash when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Version info test')
      const appVersion = '1.2.3'
      const buildDate = '2024-01-15'
      const commitHash = 'abc123def456'

      errorReporter.sendErrorReport(
        error,
        undefined,
        'https://github.com/furystack/pi-rat',
        appVersion,
        buildDate,
        commitHash,
      )

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      const decodedBody = decodeURIComponent(callArg.split('body=')[1].split('&')[0])

      expect(decodedBody).toContain('App version: 1.2.3')
      expect(decodedBody).toContain('Build date: 2024-01-15')
      expect(decodedBody).toContain('https://github.com/furystack/pi-rat/commit/abc123def456')
    })
  })

  it('should use default values for app version, build date, and commit hash when not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const errorReporter = injector.getInstance(ErrorReporter)

      const error = new Error('Default values test')

      errorReporter.sendErrorReport(error)

      expect(windowOpenSpy).toHaveBeenCalledTimes(1)

      const callArg = windowOpenSpy.mock.calls[0][0] as string
      const decodedBody = decodeURIComponent(callArg.split('body=')[1].split('&')[0])

      expect(decodedBody).toContain('App version: Unknown')
      expect(decodedBody).toContain('Build date: Unknown')
      expect(decodedBody).toContain('/commit/Unknown')
    })
  })
})
