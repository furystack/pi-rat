import type { AppShortcutWidget } from './app-shortcut-widget'
import type { EntityShortcutWidget } from './entity-shortcut-widget'
import type { HtmlWidget } from './html-widget'
import type { MarkdownWidget } from './markdown-widget'
import type { WidgetGroup } from './widget-group'

export type Widget = AppShortcutWidget | EntityShortcutWidget | HtmlWidget | MarkdownWidget | WidgetGroup
