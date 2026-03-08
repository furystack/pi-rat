import { Shade, createComponent } from '@furystack/shades'
import type { EntityShortcutWidget as EntityShortcutWidgetData } from 'common'
import { ENTITY_PATHS } from '../../routes/entity-routes.js'
import { IOT_ENTITY_ROUTE } from '../../services/register-iot-frontend.js'
import type { AppPaths } from '../../routes/index.js'
import { IconUrlWidget } from './icon-url-widget.js'

export const EntityShortcutWidget = Shade<EntityShortcutWidgetData>({
  customElementName: 'pi-rat-entity-shortcut-widget',
  render: ({ props }) => {
    const { entityName, ...rest } = props
    switch (entityName) {
      case 'dasboard':
        return <IconUrlWidget {...rest} name="Dashboards" url={`/entities${ENTITY_PATHS.dashboards}`} icon={<>📔</>} />
      case 'drive':
        return <IconUrlWidget {...rest} name="Drives" url={`/entities${ENTITY_PATHS.drives}`} icon={<>💽</>} />
      case 'user':
        return <IconUrlWidget {...rest} name="Users" url={`/entities${ENTITY_PATHS.users}`} icon={<>👤</>} />
      case 'movie':
        return <IconUrlWidget {...rest} name="Movies" url={`/entities${ENTITY_PATHS.movies}`} icon={<>🎥</>} />
      case 'movie-file':
        return <IconUrlWidget {...rest} name="Movie files" url={`/entities${ENTITY_PATHS.movieFiles}`} icon={<>🎞️</>} />
      case 'omdb-movie-metadata':
        return (
          <IconUrlWidget
            {...rest}
            name="OMDB Movie Metadata"
            url={`/entities${ENTITY_PATHS.omdbMovieMetadata}`}
            icon={<>🌐</>}
          />
        )
      case 'omdb-series-metadata':
        return (
          <IconUrlWidget
            {...rest}
            name="OMDB Series Metadata"
            url={`/entities${ENTITY_PATHS.omdbSeriesMetadata}`}
            icon={<>🌐</>}
          />
        )
      case 'config':
        return <IconUrlWidget {...rest} name="Config" url={`/entities${ENTITY_PATHS.config}`} icon={<>⚙️</>} />
      case 'device':
        return (
          <IconUrlWidget {...rest} name="IOT Devices" url={`/entities${IOT_ENTITY_ROUTE}` as AppPaths} icon={<>📡</>} />
        )
      case 'log-entry':
        return <IconUrlWidget {...rest} name="Log Entries" url={`/entities${ENTITY_PATHS.logging}`} icon={<>📝</>} />
      default:
        return <IconUrlWidget {...rest} name={'Unknown'} url={`/`} icon={<>🚫</>} />
    }
  },
})
