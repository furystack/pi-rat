import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Separator } from './Separator.js'

describe('Separator', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with correct shadow DOM name', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Separator />,
    })

    const separator = rootElement.querySelector('shade-app-separator')
    expect(separator).toBeTruthy()
  })

  it('should render as empty component', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Separator />,
    })

    const separator = rootElement.querySelector('shade-app-separator')
    expect(separator?.textContent?.trim()).toBe('')
  })
})
