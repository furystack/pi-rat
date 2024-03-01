import { Shade, createComponent } from '@furystack/shades'
import type { Device } from 'common'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { Loader } from '@furystack/shades-common-components'
import { Icon } from '../Icon.js'
import { hasCacheValue } from '@furystack/cache'

export const DeviceAvailabilityPanel = Shade<Device>({
  shadowDomName: 'device-availability-panel',
  render: ({ props, useObservable, injector }) => {
    const iotService = injector.getInstance(IotDevicesService)

    const pingArgs: Parameters<typeof iotService.findPingHistoryAsObservable> = [
      props.name,
      { order: { createdAt: 'DESC' }, top: 1 },
    ]

    const [lastPingState] = useObservable('pingState', iotService.findPingHistoryAsObservable(...pingArgs))

    if (lastPingState.status === 'uninitialized' || lastPingState.status === 'loading') {
      return <Loader />
    }

    if (lastPingState.status === 'failed') {
      return <Icon type="font" value="⚠️" title="Failed to load ping state" />
    }

    if (hasCacheValue(lastPingState)) {
      if (lastPingState.status === 'obsolete') {
        iotService.findPingHistory(...pingArgs) // reload
      }

      const [lastPing] = lastPingState.value.entries
      if (!lastPing) {
        return (
          <Icon
            onclick={(ev) => {
              ev.stopPropagation()
              ev.preventDefault()
              iotService.pingDevice(props)
            }}
            type="font"
            value="❓"
            title="No ping found, status unknown"
            style={{
              cursor: 'pointer',
              opacity: lastPingState.status === 'obsolete' ? '0.5' : '1',
            }}
          />
        )
      }

      if (new Date(lastPing.createdAt).valueOf() - new Date().valueOf() < -1000 * 60 * 5) {
        return <Icon type="font" value="🟡" title="The last ping is a bit old..." />
      }

      if (lastPing.isAvailable) {
        return <Icon type="font" value="🟢" title="Device is available" />
      } else {
        return (
          <>
            <Icon type="font" value="🔴" title="Device is not available" />
            <div title="Wake up device" style={{ width: '16px' }} onclick={() => iotService.wakeUpDevice(props)}>
              ⏰
            </div>
          </>
        )
      }
    }

    return <div />
  },
})
