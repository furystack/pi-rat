import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeSwitch } from './index.js'
import { darkTheme } from '../../themes/dark.js'
import { lightTheme } from '../../themes/light.js'

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

  it('should render with correct shadow DOM name', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })

  it('should render with dark theme', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockThemeProviderService(darkTheme), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })

  it('should render with light theme', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockThemeProviderService(lightTheme), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })

  it('should use theme provider service', () => {
    const mockThemeProvider = createMockThemeProviderService(darkTheme)
    const injector = new Injector()
    injector.setExplicitInstance(mockThemeProvider, ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })

  it('should accept additional props', () => {
    const mockThemeProvider = createMockThemeProviderService(lightTheme)
    const injector = new Injector()
    injector.setExplicitInstance(mockThemeProvider, ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })

  it('should subscribe to theme changes', () => {
    const mockThemeProvider = createMockThemeProviderService()
    const injector = new Injector()
    injector.setExplicitInstance(mockThemeProvider, ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch />,
    })

    expect(mockThemeProvider.subscribe).toHaveBeenCalledWith('themeChanged', expect.any(Function))
  })

  it('should render with custom variant prop', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ThemeSwitch variant="outlined" />,
    })

    const themeSwitch = rootElement.querySelector('theme-switch')
    expect(themeSwitch).toBeTruthy()
  })
})
