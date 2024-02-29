import { Shade, createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { Widget } from '../../components/dashboard/widget.js'

export const DeviceList = Shade({
  shadowDomName: 'pi-rat-device-list',
  render: ({ injector }) => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const devices = await injector.getInstance(IotDevicesService).findDevice({})
          return (
            <div
              style={{ marginTop: '64px', display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
              {devices.entries.map((device) => (
                <Widget type="device-availability" deviceName={device.name} enableWakeUp />
              ))}
            </div>
          )
        }}
      />
    )
  },
})
