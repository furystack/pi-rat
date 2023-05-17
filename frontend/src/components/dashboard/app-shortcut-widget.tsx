import { Shade, createComponent } from '@furystack/shades'
import type { AppShortcutWidget as AppShortcutWidgetData } from 'common'
import { IconUrlWidget } from './icon-url-widget.js'
export const AppShortcutWidget = Shade<AppShortcutWidgetData>({
  shadowDomName: 'pi-rat-app-shortcut-widget',
  render: ({ props }) => {
    const { appName, ...rest } = props
    switch (props.appName) {
      case 'home':
        return <IconUrlWidget {...rest} name="Home" url="/" icon={<>🐀</>} />
      case 'browser':
        return <IconUrlWidget {...rest} name="File Browser" url="/file-browser" icon={<>📂</>} />
      default:
        return <IconUrlWidget {...rest} name={appName} url={`/${appName}`} icon={<>🚫</>} />
    }
  },
})
