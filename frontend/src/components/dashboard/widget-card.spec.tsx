import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WidgetCard } from './widget-card.js'

describe('WidgetCard', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    })
    vi.useFakeTimers()
  })

  afterEach(async () => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('should render the card element', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <WidgetCard>
          <span>content</span>
        </WidgetCard>
      ),
    })
    await flushUpdates()

    const card = document.querySelector('pi-rat-widget-card')
    expect(card).toBeTruthy()

    const cardDiv = card?.querySelector('.card')
    expect(cardDiv).toBeTruthy()
    await injector[Symbol.asyncDispose]()
  })

  it('should render children inside the card', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <WidgetCard>
          <span className="test-child">Hello</span>
        </WidgetCard>
      ),
    })
    await flushUpdates()

    const child = document.querySelector('.test-child')
    expect(child).toBeTruthy()
    expect(child?.textContent).toBe('Hello')
    await injector[Symbol.asyncDispose]()
  })

  it('should apply size as width and height on the card div', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <WidgetCard size={300} />,
    })
    await flushUpdates()

    const cardDiv = document.querySelector('.card') as HTMLElement
    expect(cardDiv?.style.width).toBe('300px')
    expect(cardDiv?.style.height).toBe('300px')
    await injector[Symbol.asyncDispose]()
  })

  it('should default size to 256px', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <WidgetCard />,
    })
    await flushUpdates()

    const cardDiv = document.querySelector('.card') as HTMLElement
    expect(cardDiv?.style.width).toBe('256px')
    expect(cardDiv?.style.height).toBe('256px')
    await injector[Symbol.asyncDispose]()
  })

  it('should trigger entrance animation after delay', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <WidgetCard index={2} />,
    })
    await flushUpdates()

    vi.advanceTimersByTime(1100)

    expect(HTMLElement.prototype.animate).toHaveBeenCalled()
    await injector[Symbol.asyncDispose]()
  })

  it('should call animate on focus event', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <WidgetCard />,
    })
    await flushUpdates()

    const cardDiv = document.querySelector('.card') as HTMLElement
    ;(HTMLElement.prototype.animate as ReturnType<typeof vi.fn>).mockClear()

    cardDiv.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

    expect(HTMLElement.prototype.animate).toHaveBeenCalled()
    await injector[Symbol.asyncDispose]()
  })

  it('should call animate on blur event', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <WidgetCard />,
    })
    await flushUpdates()

    const cardDiv = document.querySelector('.card') as HTMLElement
    ;(HTMLElement.prototype.animate as ReturnType<typeof vi.fn>).mockClear()

    cardDiv.dispatchEvent(new FocusEvent('blur', { bubbles: true }))

    expect(HTMLElement.prototype.animate).toHaveBeenCalled()
    await injector[Symbol.asyncDispose]()
  })
})
