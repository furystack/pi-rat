import { Shade, createComponent } from '@furystack/shades'
import type { EntityShortcutWidget as EntityShortcutWidgetData } from 'common'
import {
  entityConfigRoute,
  entityDashboardsRoute,
  entityDeviceRoute,
  entityDrivesRoute,
  entityLoggingRoute,
  entityMovieFilesRoute,
  entityMoviesRoute,
  entityOmdbMovieMetadataRoute,
  entityOmdbSeriesMetadataRoute,
  entityUsersRoute,
} from '../routes/entity-routes.js'
import { IconUrlWidget } from './icon-url-widget.js'
export const EntityShortcutWidget = Shade<EntityShortcutWidgetData>({
  shadowDomName: 'pi-rat-entity-shortcut-widget',
  render: ({ props }) => {
    const { entityName, ...rest } = props
    switch (props.entityName) {
      case 'dasboard':
        return <IconUrlWidget {...rest} name="Dashboards" url={entityDashboardsRoute.url} icon={<>📔</>} />
      case 'drive':
        return <IconUrlWidget {...rest} name="Drives" url={entityDrivesRoute.url} icon={<>💽</>} />
      case 'user':
        return <IconUrlWidget {...rest} name="Users" url={entityUsersRoute.url} icon={<>👤</>} />
      case 'movie':
        return <IconUrlWidget {...rest} name="Movies" url={entityMoviesRoute.url} icon={<>🎥</>} />
      case 'movie-file':
        return <IconUrlWidget {...rest} name="Movie files" url={entityMovieFilesRoute.url} icon={<>🎞️</>} />
      case 'omdb-movie-metadata':
        return (
          <IconUrlWidget {...rest} name="OMDB Movie Metadata" url={entityOmdbMovieMetadataRoute.url} icon={<>🌐</>} />
        )
      case 'omdb-series-metadata':
        return (
          <IconUrlWidget {...rest} name="OMDB Series Metadata" url={entityOmdbSeriesMetadataRoute.url} icon={<>🌐</>} />
        )
      case 'config':
        return <IconUrlWidget {...rest} name="Config" url={entityConfigRoute.url} icon={<>⚙️</>} />
      case 'device':
        return <IconUrlWidget {...rest} name="IOT Devices" url={entityDeviceRoute.url} icon={<>📡</>} />
      case 'log-entry':
        return <IconUrlWidget {...rest} name="Log Entries" url={entityLoggingRoute.url} icon={<>📝</>} />
      default:
        return <IconUrlWidget {...rest} name={'Unknown'} url={`/`} icon={<>🚫</>} />
    }
  },
})
