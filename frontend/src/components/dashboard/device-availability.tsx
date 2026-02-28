import type { CacheWithValue } from '@furystack/cache'
import { serializeToQueryString } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView, Skeleton } from '@furystack/shades-common-components'
import type { Device, DeviceAvailability as DeviceAvailabilityProps, Icon as IconType } from 'common'
import { AppLink } from '../../app-routes.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { SessionService } from '../../services/session.js'
import { DynamicIcon } from '../dynamic-icon.js'
import { DeviceAvailabilityPanel } from '../iot-devices/device-availability-panel.js'
import { WidgetCard } from './widget-card.js'

const DeviceAvailabilityContent = Shade<{
  data: CacheWithValue<Device>
  size: number
  icon?: IconType
}>({
  shadowDomName: 'pi-rat-device-availability-content',
  render: ({ props, injector, useObservable }) => {
    const { size } = props
    const device = props.data.value

    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)

    return (
      <AppLink
        tabIndex={0}
        title={device.name}
        href="/iot/device/:id"
        params={{ id: device.name }}
        style={{ textDecoration: 'none' }}
      >
        <WidgetCard size={size}>
          <div className="overlay">
            <DeviceAvailabilityPanel {...device} />

            {currentUser?.roles.includes('admin') ? (
              <div style={{ display: 'flex' }}>
                <div
                  style={{ width: '16px', height: '16px', marginLeft: '1em' }}
                  onclick={(ev) => {
                    ev.preventDefault()
                    ev.stopImmediatePropagation()
                    navigateToRoute(
                      injector,
                      '/entities/iot-devices',
                      {},
                      {
                        queryString: serializeToQueryString({
                          gedst: { mode: 'edit', currentId: device.name },
                        }),
                      },
                    )
                  }}
                  title="Edit device details"
                >
                  ✏️
                </div>
              </div>
            ) : null}
          </div>
          <div
            className="cover"
            style={{
              verticalAlign: 'middle',
              textAlign: 'center',
              lineHeight: `${size * 0.8}px`,
              fontSize: `${size / 2}px`,
            }}
          >
            {props.icon ? <DynamicIcon {...props.icon} /> : null}
          </div>
          <div className="title-bar">{device.name}</div>
        </WidgetCard>
      </AppLink>
    )
  },
})

export const DeviceAvailability = Shade<DeviceAvailabilityProps & { index?: number; size?: number }>({
  shadowDomName: 'pi-rat-device-availability-widget',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  render: ({ props, injector }) => {
    const { size = 256 } = props

    const iotDevices = injector.getInstance(IotDevicesService)

    return (
      <CacheView
        cache={iotDevices.deviceCache}
        args={[props.deviceName]}
        content={DeviceAvailabilityContent}
        contentProps={{ size, icon: props.icon }}
        loader={<Skeleton />}
        error={() => <>:(</>}
      />
    )
  },
})
