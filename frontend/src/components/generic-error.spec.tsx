import { Injector } from '@furystack/inject'
import { ResponseError } from '@furystack/rest-client-fetch'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { darkTheme } from '../themes/dark.js'
import { GenericErrorPage } from './generic-error.js'

const createMockThemeProviderService = () => {
  return {
    theme: darkTheme,
  } as unknown as ThemeProviderService
}

const create404ResponseError = () => {
  return new ResponseError('Not Found', { status: 404 } as Response)
}

describe('GenericErrorPage 404 handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render Result with status 404 for a 404 ResponseError', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <GenericErrorPage error={create404ResponseError()} />,
      })
      await flushUpdates()

      const result = rootElement.querySelector('shade-result')
      expect(result).toBeTruthy()
      expect(result?.getAttribute('data-status')).toBe('404')
    })
  })

  it('should render Result with status error for a generic error', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <GenericErrorPage error={new Error('Something broke')} />,
      })
      await flushUpdates()

      const result = rootElement.querySelector('shade-result')
      expect(result).toBeTruthy()
      expect(result?.getAttribute('data-status')).toBe('error')
    })
  })

  it('should render Go Home button', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <GenericErrorPage error={create404ResponseError()} />,
      })
      await flushUpdates()

      expect(rootElement.textContent).toContain('Go Home')
    })
  })

  it('should render Retry button when retry prop is provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <GenericErrorPage error={new Error('fail')} retry={async () => {}} />,
      })
      await flushUpdates()

      expect(rootElement.textContent).toContain('Retry')
    })
  })

  it('should render Report error button when error is provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <GenericErrorPage error={new Error('fail')} />,
      })
      await flushUpdates()

      expect(rootElement.textContent).toContain('Report error')
    })
  })
})
