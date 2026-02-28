import { hasCacheValue } from '@furystack/cache'
import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons, Loader } from '@furystack/shades-common-components'
import type { Device } from 'common'
import { IotDevicesService } from '../../services/iot-devices-service.js'

export const DeviceAvailabilityPanel = Shade<Device>({
  shadowDomName: 'device-availability-panel',
  render: ({ props, useObservable, injector, useDisposable }) => {
    const iotService = injector.getInstance(IotDevicesService)

    const pingArgs: Parameters<typeof iotService.findPingHistoryAsObservable> = [
      props.name,
      { order: { createdAt: 'DESC' }, top: 1 },
    ]

    const wolEntryArgs: Parameters<typeof iotService.findAwakeHistoryAsObservable> = [
      props.name,
      { order: { createdAt: 'DESC' }, top: 1 },
    ]

    useDisposable('refresher', () => {
      const interval = setInterval(() => {
        void iotService.findPingHistory(...pingArgs)
        void iotService.findAwakeHistory(...wolEntryArgs)
      }, 1000)

      return { [Symbol.dispose]: () => clearInterval(interval) }
    })

    const [lastPingState] = useObservable('pingState', iotService.findPingHistoryAsObservable(...pingArgs))

    if (lastPingState.status === 'failed') {
      return <Icon icon={icons.warning} color="warning" title="Failed to load ping state" />
    }

    if (!hasCacheValue(lastPingState)) {
      return <Loader />
    }

    if (hasCacheValue(lastPingState)) {
      const lastPing = lastPingState.value.entries[0]

      if (!lastPing) {
        return (
          <span
            onclick={(ev) => {
              ev.stopPropagation()
              ev.preventDefault()
              void iotService.pingDevice(props)
            }}
            title="No ping found, status unknown. Will refresh soon"
            style={{
              cursor: 'pointer',
              opacity: lastPingState.status === 'obsolete' ? '0.5' : '1',
            }}
          >
            <Icon icon={icons.info} />
          </span>
        )
      }

      if (lastPing.isAvailable) {
        return (
          <span
            title="Device is available"
            style={{
              cursor: 'pointer',
              opacity: lastPingState.status === 'obsolete' ? '0.5' : '1',
              color: 'var(--theme-success-main, #4caf50)',
            }}
          >
            <Icon icon={icons.circleDot} />
          </span>
        )
      } else {
        return (
          <span
            title="Device is not available. Click here to wake it up"
            onclick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              void iotService
                .wakeUpDevice(props)
                .then(() => iotService.pingDevice(props))
                .then(() => iotService.findPingHistory(...pingArgs))
            }}
            style={{
              cursor: 'pointer',
              color: 'var(--theme-error-main, #f44336)',
            }}
          >
            <Icon icon={icons.circleDot} />
          </span>
        )
      }
    }

    return <div />
  },
})
