import { Shade, createComponent } from '@furystack/shades'
import type { AppShortcutWidget as AppShortcutWidgetData } from 'common'
import { appSettingsRoute } from '../routes/admin-routes.js'
import { defaultDashboardRoute } from '../routes/dashboard-routes.js'
import { fileBrowserRoute } from '../routes/file-browser-routes.js'
import { iotDeviceListRoute } from '../routes/iot-routes.js'
import { LogEntriesTerminalRoute } from '../routes/logging-routes.js'
import { movieListRoute, seriesListRoute } from '../routes/movie-routes.js'
import { IconUrlWidget } from './icon-url-widget.js'
export const AppShortcutWidget = Shade<AppShortcutWidgetData>({
  shadowDomName: 'pi-rat-app-shortcut-widget',
  render: ({ props }) => {
    const { appName, ...rest } = props
    switch (props.appName) {
      case 'home':
        return <IconUrlWidget {...rest} name="Home" url={defaultDashboardRoute.url} icon={<>🐀</>} />
      case 'browser':
        return <IconUrlWidget {...rest} name="File Browser" url={fileBrowserRoute.url} icon={<>📂</>} />
      case 'movies':
        return <IconUrlWidget {...rest} name="Movies" url={movieListRoute.url} icon={<>🎥</>} />
      case 'series':
        return <IconUrlWidget {...rest} name="Series" url={seriesListRoute.url} icon={<>📺</>} />
      case 'iot':
        return <IconUrlWidget {...rest} name="IOT Devices" url={iotDeviceListRoute.url} icon={<>📡</>} />
      case 'logging-terminal':
        return <IconUrlWidget {...rest} name="Logging Terminal" url={LogEntriesTerminalRoute.url} icon={<>💻</>} />
      case 'app-settings':
        return <IconUrlWidget {...rest} name="Application Settings" url={appSettingsRoute.url} icon={<>🔧</>} />
      default:
        return <IconUrlWidget {...rest} name={appName} url={`/${appName}`} icon={<>🚫</>} />
    }
  },
})
