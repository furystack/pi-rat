import type { AppShortcutWidget } from './app-shortcut-widget.js'
import type { EntityShortcutWidget } from './entity-shortcut-widget.js'
import type { HtmlWidget } from './html-widget.js'
import type { MarkdownWidget } from './markdown-widget.js'
import type { MovieWidget } from './movie-widget.js'
import type { WidgetGroup } from './widget-group.js'

export type Widget = AppShortcutWidget | EntityShortcutWidget | HtmlWidget | MarkdownWidget | MovieWidget | WidgetGroup
