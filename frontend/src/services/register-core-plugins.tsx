import { createComponent } from '@furystack/shades'
import type { Injector } from '@furystack/inject'

import { AppShortcutWidget } from '../components/dashboard/app-shortcut-widget.js'
import { ContinueWatchingWidgetGroup } from '../components/dashboard/continue-watching.js'
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
 * Registers core built-in widgets and command providers into the registries.
 * Plugin-specific registrations live in their own register functions
 * (e.g. registerIotFrontend).
 */
export const registerCorePlugins = (injector: Injector) => {
  const w = injector.getInstance(WidgetRegistry)
  w.registerWidget('app-shortcut', (p) => <AppShortcutWidget {...p} />)
  w.registerWidget('entity-shortcut', (p) => <EntityShortcutWidget {...p} />)
  w.registerWidget('html', (p) => <HtmlWidget {...p} />)
  w.registerWidget('markdown', (p) => <MarkdownWidget {...p} />)
  w.registerWidget('group', (p) => <WidgetGroup {...p} />)
  w.registerWidget('movie', (p) => <MovieWidget {...p} />)
  w.registerWidget('series', (p) => <SeriesWidget {...p} />)
  w.registerWidget('continue-watching', (p) => <ContinueWatchingWidgetGroup {...p} />)

  const c = injector.getInstance(CommandProviderRegistry)
  c.registerProvider(appSettingsCommandProvider)
  c.registerProvider(browserCommandProvider)
  c.registerProvider(continueWatchingCommandProvider)
  c.registerProvider(entitiesCommandProvider)
  c.registerProvider(searchMovieCommandProvider)
  c.registerProvider(searchSeriesCommandProvider)
}
