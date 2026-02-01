import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, ScreenService } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Error404 } from './error-404.js'
import { darkTheme } from '../themes/dark.js'

const createMockScreenService = () => {
  return {
    screenSize: {
      atLeast: {
        xs: new ObservableValue(true),
        sm: new ObservableValue(true),
        md: new ObservableValue(true),
        lg: new ObservableValue(true),
        xl: new ObservableValue(false),
      },
    },
  } as unknown as ScreenService
}

const createMockThemeProviderService = () => {
  return {
    theme: darkTheme,
  } as unknown as ThemeProviderService
}

describe('Error404', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with correct shadow DOM name', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockScreenService(), ScreenService)
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Error404 />,
    })

    const error404 = rootElement.querySelector('shade-404-not-found')
    expect(error404).toBeTruthy()
  })

  it('should display 404 error message', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockScreenService(), ScreenService)
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Error404 />,
    })

    const error404 = rootElement.querySelector('shade-404-not-found')
    expect(error404?.textContent).toContain('The page you are looking for is not exists')
  })

  it('should display helpful suggestions', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockScreenService(), ScreenService)
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Error404 />,
    })

    const error404 = rootElement.querySelector('shade-404-not-found')
    expect(error404?.textContent).toContain('The URL above is correct')
    expect(error404?.textContent).toContain('You have logged in')
    expect(error404?.textContent).toContain('You have the neccessary permissions')
  })

  it('should render GenericErrorPage component', () => {
    const injector = new Injector()
    injector.setExplicitInstance(createMockScreenService(), ScreenService)
    injector.setExplicitInstance(createMockThemeProviderService(), ThemeProviderService)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Error404 />,
    })

    const genericErrorPage = rootElement.querySelector('multiverse-generic-error-page')
    expect(genericErrorPage).toBeTruthy()
  })
})
