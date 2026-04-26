import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot, ScreenService } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaOverviewLayout } from './media-overview-layout.js'

describe('MediaOverviewLayout', () => {
  let injector: Injector

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    })
    vi.useFakeTimers()

    injector = new Injector()
    const mockScreenService = {
      screenSize: {
        atLeast: {
          md: new ObservableValue(true),
        },
      },
    }
    injector.bind(ScreenService, () => mockScreenService as never)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('should render the layout component', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MediaOverviewLayout thumbnailUrl="https://example.com/poster.jpg" title="Test Movie">
          <p>Details here</p>
        </MediaOverviewLayout>
      ),
    })
    await flushUpdates()

    const el = document.querySelector('media-overview-layout')
    expect(el).toBeTruthy()
  })

  it('should render the poster image with correct src and alt', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MediaOverviewLayout thumbnailUrl="https://example.com/poster.jpg" title="Test Movie">
          <p>Details</p>
        </MediaOverviewLayout>
      ),
    })
    await flushUpdates()

    const img = document.querySelector('.poster-image') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toBe('https://example.com/poster.jpg')
    expect(img.alt).toBe('thumbnail for Test Movie')
  })

  it('should render children inside the details container', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MediaOverviewLayout thumbnailUrl="https://example.com/poster.jpg" title="Test Movie">
          <p className="test-detail">Some movie details</p>
        </MediaOverviewLayout>
      ),
    })
    await flushUpdates()

    const detail = document.querySelector('.test-detail')
    expect(detail).toBeTruthy()
    expect(detail?.textContent).toBe('Some movie details')
  })

  it('should apply detailsContainerStyle to the details container', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MediaOverviewLayout
          thumbnailUrl="https://example.com/poster.jpg"
          title="Test Movie"
          detailsContainerStyle={{ maxHeight: 'calc(100% - 128px)', overflowY: 'auto' }}
        >
          <p>Details</p>
        </MediaOverviewLayout>
      ),
    })
    await flushUpdates()

    const detailsContainer = document.querySelector('.details-container') as HTMLElement
    expect(detailsContainer?.style.maxHeight).toBe('calc(100% - 128px)')
    expect(detailsContainer?.style.overflowY).toBe('auto')
  })

  it('should trigger the poster entrance animation', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MediaOverviewLayout thumbnailUrl="https://example.com/poster.jpg" title="Test Movie">
          <p>Details</p>
        </MediaOverviewLayout>
      ),
    })
    await flushUpdates()

    vi.advanceTimersByTime(200)

    expect(HTMLElement.prototype.animate).toHaveBeenCalled()
  })
})
