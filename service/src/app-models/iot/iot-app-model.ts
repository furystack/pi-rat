import type { InternalAppModel } from '../../AppModelManager.js'
import { DeviceAvailabilityHub } from './device-availability-hub.js'
import { IotManifest } from './iot-manifest.js'
import { setupIotApi } from './setup-iot-api.js'
import { setupIotStore } from './setup-store.js'

export const IotAppModel: InternalAppModel = {
  manifest: IotManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await setupIotStore(injector)
    await setupIotApi(injector)
    void injector.get(DeviceAvailabilityHub).init()
  },
}
