import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'
import type { EntityShortcutWidget as EntityShortcutWidgetData } from 'common'
import { IconUrlWidget } from './icon-url-widget.js'

export const EntityShortcutWidget = Shade<EntityShortcutWidgetData>({
  shadowDomName: 'pi-rat-entity-shortcut-widget',
  render: ({ props }) => {
    const { entityName, ...rest } = props
    switch (props.entityName) {
      case 'dasboard':
        return (
          <IconUrlWidget {...rest} name="Dashboards" url="/entities/dashboards" icon={<Icon icon={icons.layers} />} />
        )
      case 'drive':
        return <IconUrlWidget {...rest} name="Drives" url="/entities/drives" icon={<>💽</>} />
      case 'user':
        return <IconUrlWidget {...rest} name="Users" url="/entities/users" icon={<Icon icon={icons.user} />} />
      case 'movie':
        return <IconUrlWidget {...rest} name="Movies" url="/entities/movies" icon={<Icon icon={icons.film} />} />
      case 'movie-file':
        return (
          <IconUrlWidget {...rest} name="Movie files" url="/entities/movie-files" icon={<Icon icon={icons.film} />} />
        )
      case 'omdb-movie-metadata':
        return (
          <IconUrlWidget
            {...rest}
            name="OMDB Movie Metadata"
            url="/entities/omdb-movie-metadata"
            icon={<Icon icon={icons.globe} />}
          />
        )
      case 'omdb-series-metadata':
        return (
          <IconUrlWidget
            {...rest}
            name="OMDB Series Metadata"
            url="/entities/omdb-series-metadata"
            icon={<Icon icon={icons.globe} />}
          />
        )
      case 'config':
        return <IconUrlWidget {...rest} name="Config" url="/entities/config" icon={<Icon icon={icons.settings} />} />
      case 'device':
        return <IconUrlWidget {...rest} name="IOT Devices" url="/entities/iot-devices" icon={<>📡</>} />
      case 'log-entry':
        return (
          <IconUrlWidget {...rest} name="Log Entries" url="/entities/logging" icon={<Icon icon={icons.fileText} />} />
        )
      default:
        return <IconUrlWidget {...rest} name={'Unknown'} url={`/`} icon={<Icon icon={icons.stopCircle} />} />
    }
  },
})
