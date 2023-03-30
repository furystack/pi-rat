import { Shade, createComponent } from '@furystack/shades'
import type { EntityShortcutWidget as EntityShortcutWidgetData } from 'common'
import { IconUrlWidget } from './icon-url-widget'
export const EntityShortcutWidget = Shade<EntityShortcutWidgetData>({
  shadowDomName: 'pi-rat-entity-shortcut-widget',
  render: ({ props }) => {
    const { entityName, ...rest } = props
    switch (props.entityName) {
      case 'dasboard':
        return <IconUrlWidget {...rest} name="Dashboards" url="/entities/dashboards" icon={<>📔</>} />
      case 'drive':
        return <IconUrlWidget {...rest} name="Drives" url="/entities/drives" icon={<>💽</>} />
      case 'user':
        return <IconUrlWidget {...rest} name="Users" url="/entities/users" icon={<>👤</>} />
      default:
        return <IconUrlWidget {...rest} name={'Unknown'} url={`/`} icon={<>🚫</>} />
    }
  },
})
