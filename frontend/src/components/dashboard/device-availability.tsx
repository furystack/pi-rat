import type { CacheWithValue } from '@furystack/cache'
import { serializeToQueryString } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView, Skeleton, promisifyAnimation } from '@furystack/shades-common-components'
import type { Device, DeviceAvailability as DeviceAvailabilityProps, Icon as IconType } from 'common'
import { AppLink } from '../../app-routes.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { SessionService } from '../../services/session.js'
import { Icon } from '../Icon.js'
import { DeviceAvailabilityPanel } from '../iot-devices/device-availability-panel.js'

const focus = (el: HTMLElement) => {
  void promisifyAnimation(el, [{ filter: 'saturate(0.3)brightness(0.6)' }, { filter: 'saturate(1)brightness(1)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  void promisifyAnimation(
    el.querySelector('.cover') as HTMLImageElement,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
    {
      fill: 'forwards',
      easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
      duration: 850,
    },
  )
}

const blur = (el: HTMLElement) => {
  void promisifyAnimation(el, [{ filter: 'saturate(1)brightness(1)' }, { filter: 'saturate(0.3)brightness(0.6)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  void promisifyAnimation(
    el.querySelector('.cover') as HTMLImageElement,
    [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { fill: 'forwards', duration: 150 },
  )
}

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
        style={{
          textDecoration: 'none',
        }}
      >
        <div
          onfocus={(ev) => focus(ev.target as HTMLElement)}
          onblur={(ev) => blur(ev.target as HTMLElement)}
          onmouseenter={(ev) => focus(ev.target as HTMLElement)}
          onmouseleave={(ev) => blur(ev.target as HTMLElement)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            width: `${size}px`,
            height: `${size}px`,
            filter: 'saturate(0.3)brightness(0.6)',
            background: 'rgba(128,128,128,0.1)',
            borderRadius: '4px',
            margin: '8px',
            overflow: 'hidden',
            color: 'white',
            boxShadow: 'rgba(0, 0, 0, 0.3) 1px 3px 6px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              zIndex: '1',
              fontSize: '1.3em',
              width: 'calc(100% - 2em)',
              display: 'flex',
              margin: '1em',
              justifyContent: 'space-between',
            }}
          >
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
              display: 'inline-block',
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              transform: 'scale(1)',
              verticalAlign: 'middle',
              textAlign: 'center',
              lineHeight: `${size * 0.8}px`,
              fontSize: `${size / 2}px`,
            }}
          >
            {props.icon ? <Icon {...props.icon} /> : null}
          </div>
          <div
            style={{
              width: 'calc(100% - 2em)',
              overflow: 'hidden',
              textAlign: 'center',
              textOverflow: 'ellipsis',
              position: 'absolute',
              bottom: '0',
              whiteSpace: 'nowrap',
              padding: '1em',
              background: 'rgba(0,0,0,0.7)',
            }}
          >
            {device.name}
          </div>
        </div>
      </AppLink>
    )
  },
})

export const DeviceAvailability = Shade<DeviceAvailabilityProps & { index?: number; size?: number }>({
  shadowDomName: 'pi-rat-device-availability-widget',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  render: ({ props, injector, useHostProps }) => {
    useHostProps({ style: { transform: 'scale(0)' } })
    const { size = 256 } = props

    const iotDevices = injector.getInstance(IotDevicesService)

    return (
      <CacheView
        cache={iotDevices.deviceCache}
        args={[props.deviceName]}
        content={DeviceAvailabilityContent}
        contentProps={{ size, icon: props.icon }}
        loader={<Skeleton />}
      />
    )
  },
})
