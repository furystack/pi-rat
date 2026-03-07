import { Shade, createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { Widget } from '../../components/dashboard/widget.js'

export const DeviceList = Shade({
  customElementName: 'pi-rat-device-list',
  css: {
    '& .device-grid': {
      marginTop: '64px',
      display: 'flex',
      width: '100%',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  },
  render: ({ injector }) => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const devices = await injector.getInstance(IotDevicesService).findDevice({})
          return (
            <div className="device-grid">
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
