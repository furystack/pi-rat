import type { DeviceAvailability as DeviceAvailabilityProps } from '../../../../common/src/models/dashboard/device-availability.js'
import { LinkToRoute, Shade, createComponent } from '@furystack/shades'
import { Skeleton, promisifyAnimation } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'
import { isFailedCacheResult, isLoadedCacheResult, isPendingCacheResult } from '@furystack/cache'
import { navigateToRoute } from '../../navigate-to-route.js'
import { entityDeviceRoute } from '../routes/entity-routes.js'
import { serializeToQueryString } from '@furystack/rest'
import { iotDeviceRoute } from '../routes/iot-routes.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { Icon } from '../Icon.js'
import { DeviceAvailabilityPanel } from '../iot-devices/device-availability-panel.js'

const focus = (el: HTMLElement) => {
  promisifyAnimation(el, [{ filter: 'saturate(0.3)brightness(0.6)' }, { filter: 'saturate(1)brightness(1)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  promisifyAnimation(
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
  promisifyAnimation(el, [{ filter: 'saturate(1)brightness(1)' }, { filter: 'saturate(0.3)brightness(0.6)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  promisifyAnimation(
    el.querySelector('.cover') as HTMLImageElement,
    [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { fill: 'forwards', duration: 150 },
  )
}

export const DeviceAvailability = Shade<DeviceAvailabilityProps & { index?: number; size?: number }>({
  shadowDomName: 'pi-rat-device-availability-widget',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  constructed: ({ props, element }) => {
    element.style.transform = 'scale(0)'
    promisifyAnimation(element, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      fill: 'forwards',
      delay: (props.index || 0) * 160 + Math.random() * 100,
      duration: 700,
      easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    })
  },
  render: ({ props, injector, useObservable }) => {
    const { size = 256 } = props

    const iotDevices = injector.getInstance(IotDevicesService)

    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const [device] = useObservable('movie', iotDevices.getDeviceAsObservable(props.deviceName))

    if (isLoadedCacheResult(device)) {
      return (
        <LinkToRoute
          tabIndex={0}
          title={device.value.name}
          route={iotDeviceRoute}
          params={{ id: props.deviceName }}
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
              <DeviceAvailabilityPanel {...device.value} />

              {currentUser?.roles.includes('admin') ? (
                <div style={{ display: 'flex' }}>
                  <div
                    style={{ width: '16px', height: '16px', marginLeft: '1em' }}
                    onclick={(ev) => {
                      ev.preventDefault()
                      ev.stopImmediatePropagation()
                      navigateToRoute(
                        injector,
                        entityDeviceRoute,
                        {},
                        serializeToQueryString({ gedst: { mode: 'edit', currentId: device.value.name } }),
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
              {device.value.name}
            </div>
          </div>
        </LinkToRoute>
      )
    } else if (isPendingCacheResult(device)) {
      return <Skeleton />
    } else if (isFailedCacheResult(device)) {
      return <>{`:(`}</>
    }

    return <>{JSON.stringify(device)}</>
  },
})
