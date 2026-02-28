import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'
import type { AppShortcutWidget as AppShortcutWidgetData } from 'common'
import type { AppPaths } from '../../app-routes.js'
import { IconUrlWidget } from './icon-url-widget.js'

export const AppShortcutWidget = Shade<AppShortcutWidgetData>({
  shadowDomName: 'pi-rat-app-shortcut-widget',
  render: ({ props }) => {
    const { appName, ...rest } = props
    switch (props.appName) {
      case 'home':
        return <IconUrlWidget {...rest} name="Home" url="/" icon={<>🐀</>} />
      case 'browser':
        return (
          <IconUrlWidget {...rest} name="File Browser" url="/file-browser" icon={<Icon icon={icons.folderOpen} />} />
        )
      case 'movies':
        return <IconUrlWidget {...rest} name="Movies" url="/movies" icon={<Icon icon={icons.film} />} />
      case 'series':
        return <IconUrlWidget {...rest} name="Series" url="/series" icon={<>📺</>} />
      case 'iot':
        return <IconUrlWidget {...rest} name="IOT Devices" url="/iot/devices" icon={<>📡</>} />
      case 'logging-terminal':
        return <IconUrlWidget {...rest} name="Logging Terminal" url="/logging/terminal" icon={<>💻</>} />
      case 'app-settings':
        return (
          <IconUrlWidget
            {...rest}
            name="Application Settings"
            url="/app-settings"
            icon={<Icon icon={icons.wrench} />}
          />
        )
      default:
        return (
          <IconUrlWidget
            {...rest}
            name={appName}
            url={`/${appName}` as AppPaths}
            icon={<Icon icon={icons.stopCircle} />}
          />
        )
    }
  },
})
