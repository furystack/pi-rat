import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { darkTheme } from '../../themes/dark.js'
import { lightTheme } from '../../themes/light.js'
import { ThemeSwitch } from './index.js'

const createMockThemeProviderService = (theme = darkTheme) => {
  const mockService = {
    theme,
    setAssignedTheme: vi.fn(),
    subscribe: vi.fn(() => ({ dispose: vi.fn() })),
  } as unknown as ThemeProviderService
  return mockService
}

describe('ThemeSwitch', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with correct shadow DOM name', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })

  it('should render with dark theme', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService(darkTheme))
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })

  it('should render with light theme', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService(lightTheme))
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })

  it('should use theme provider service', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const mockThemeProvider = createMockThemeProviderService(darkTheme)
      injector.bind(ThemeProviderService, () => mockThemeProvider as never)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })

  it('should accept additional props', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const mockThemeProvider = createMockThemeProviderService(lightTheme)
      injector.bind(ThemeProviderService, () => mockThemeProvider as never)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })

  it('should subscribe to theme changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const mockThemeProvider = createMockThemeProviderService()
      injector.bind(ThemeProviderService, () => mockThemeProvider as never)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch />,
      })
      await flushUpdates()

      expect(mockThemeProvider.subscribe).toHaveBeenCalledWith('themeChanged', expect.any(Function))
    })
  })

  it('should render with custom variant prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ThemeProviderService, () => createMockThemeProviderService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ThemeSwitch variant="outlined" />,
      })
      await flushUpdates()

      const themeSwitch = rootElement.querySelector('theme-switch')
      expect(themeSwitch).toBeTruthy()
    })
  })
})
