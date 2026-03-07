import { createComponent } from '@furystack/shades'
import type { Injector } from '@furystack/inject'
import type {
  AppShortcutWidget as AppShortcutWidgetData,
  ContinueWatchingWidgetGroup as ContinueWatchingData,
  DeviceAvailability as DeviceAvailabilityData,
  EntityShortcutWidget as EntityShortcutWidgetData,
  HtmlWidget as HtmlWidgetData,
  MarkdownWidget as MarkdownWidgetData,
  MovieWidget as MovieWidgetData,
  SeriesWidget as SeriesWidgetData,
  WidgetGroup as WidgetGroupData,
} from 'common'

import { AppShortcutWidget } from '../components/dashboard/app-shortcut-widget.js'
import { ContinueWatchingWidgetGroup } from '../components/dashboard/continue-watching.js'
import { DeviceAvailability } from '../components/dashboard/device-availability.js'
import { EntityShortcutWidget } from '../components/dashboard/entity-shortcut-widget.js'
import { HtmlWidget } from '../components/dashboard/html-widget.js'
import { MarkdownWidget } from '../components/dashboard/markdown-widget.js'
import { MovieWidget } from '../components/dashboard/movie-widget.js'
import { SeriesWidget } from '../components/dashboard/series-widget.js'
import { WidgetGroup } from '../components/dashboard/widget-group.js'
import { appSettingsCommandProvider } from '../components/command-palette/command-providers/app-settings.js'
import { browserCommandProvider } from '../components/command-palette/command-providers/browser.js'
import { continueWatchingCommandProvider } from '../components/command-palette/command-providers/continue-watching.js'
import { entitiesCommandProvider } from '../components/command-palette/command-providers/entities.js'
import { searchMovieCommandProvider } from '../components/command-palette/command-providers/search-movie.js'
import { searchSeriesCommandProvider } from '../components/command-palette/command-providers/search-series.js'
import { CommandProviderRegistry, WidgetRegistry } from './registries/index.js'

/**
 * Registers all built-in widgets and command providers into the registries.
 * When plugins are extracted, their registrations will move to their own
 * registerXxxPlugin() functions.
 */
export const registerCorePlugins = (injector: Injector) => {
  const w = injector.getInstance(WidgetRegistry)
  w.registerWidget('app-shortcut', (p) => <AppShortcutWidget {...(p as AppShortcutWidgetData)} />)
  w.registerWidget('entity-shortcut', (p) => <EntityShortcutWidget {...(p as EntityShortcutWidgetData)} />)
  w.registerWidget('html', (p) => <HtmlWidget {...(p as HtmlWidgetData)} />)
  w.registerWidget('markdown', (p) => <MarkdownWidget {...(p as MarkdownWidgetData)} />)
  w.registerWidget('group', (p) => <WidgetGroup {...(p as WidgetGroupData)} />)
  w.registerWidget('movie', (p) => <MovieWidget {...(p as MovieWidgetData)} />)
  w.registerWidget('series', (p) => <SeriesWidget {...(p as SeriesWidgetData)} />)
  w.registerWidget('continue-watching', (p) => <ContinueWatchingWidgetGroup {...(p as ContinueWatchingData)} />)
  w.registerWidget('device-availability', (p) => <DeviceAvailability {...(p as DeviceAvailabilityData)} />)

  const c = injector.getInstance(CommandProviderRegistry)
  c.registerProvider(appSettingsCommandProvider)
  c.registerProvider(browserCommandProvider)
  c.registerProvider(continueWatchingCommandProvider)
  c.registerProvider(entitiesCommandProvider)
  c.registerProvider(searchMovieCommandProvider)
  c.registerProvider(searchSeriesCommandProvider)
}
