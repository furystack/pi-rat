import type { Widget } from './widget'

export interface AppShortcutWidget {
  type: 'app-shortcut'
  appName: 'home' | 'browser'
  icon: string
  title: string
}

export const isAppShortcutWidget = (widget: Widget): widget is AppShortcutWidget => {
  return widget.type === 'app-shortcut'
}
