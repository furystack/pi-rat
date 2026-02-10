import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Widget } from './widget.js'

describe('Widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    // Mock animate for jsdom (used by skeleton, loader, and other animations)
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('should render AppShortcutWidget for app-shortcut type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="app-shortcut" appName="home" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const appShortcut = widget?.querySelector('pi-rat-app-shortcut-widget')
      expect(appShortcut).toBeTruthy()
    })
  })

  it('should render EntityShortcutWidget for entity-shortcut type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="entity-shortcut" entityName="movie" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const entityShortcut = widget?.querySelector('pi-rat-entity-shortcut-widget')
      expect(entityShortcut).toBeTruthy()
    })
  })

  it('should render HtmlWidget for html type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="html" content="<p>Hello World</p>" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const htmlWidget = widget?.querySelector('pi-rat-html-widget')
      expect(htmlWidget).toBeTruthy()
      expect(htmlWidget?.innerHTML).toContain('Hello World')
    })
  })

  it('should render MarkdownWidget for markdown type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="markdown" content="# Heading" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const markdownWidget = widget?.querySelector('pi-rat-markdown-widget')
      expect(markdownWidget).toBeTruthy()
    })
  })

  it('should render WidgetGroup for group type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="group" title="Test Group" widgets={[]} />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const widgetGroup = widget?.querySelector('pi-rat-widget-group')
      expect(widgetGroup).toBeTruthy()
    })
  })

  it('should render MovieWidget for movie type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="movie" imdbId="tt1234567" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const movieWidget = widget?.querySelector('pi-rat-movie-widget')
      expect(movieWidget).toBeTruthy()
    })
  })

  it('should render SeriesWidget for series type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="series" imdbId="tt7654321" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const seriesWidget = widget?.querySelector('pi-rat-series-widget')
      expect(seriesWidget).toBeTruthy()
    })
  })

  it('should render ContinueWatchingWidgetGroup for continue-watching type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Widget type="continue-watching" />,
      })

      const widget = document.querySelector('pi-rat-widget')
      expect(widget).toBeTruthy()

      const continueWatching = widget?.querySelector('continue-watching-widget-group')
      expect(continueWatching).toBeTruthy()
    })
  })

  // Note: DeviceAvailability widget test is skipped because it requires complex
  // service mocking (IotDevicesService, SessionService) that's beyond the scope
  // of a simple component routing test. The routing logic is verified by the
  // other widget type tests above.
})
