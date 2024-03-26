import type { RequestAction } from '@furystack/rest-service'
import { AuthorizationError, isAuthorized } from '@furystack/core'
import { JsonResult } from '@furystack/rest-service'
import { Device, DeviceAwakeHistory, type AwakeEndpoint } from 'common'
import { wakeOnLan } from '../../utils/wake-on-lan.js'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'

export const AwakeAction: RequestAction<AwakeEndpoint> = async ({ injector, getUrlParams }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new AuthorizationError('Needs admin access')
  }

  const { id } = getUrlParams()

  const device = await getDataSetFor(injector, Device, 'name').get(injector, id)

  if (!device) {
    throw new RequestError('Device not found', 404)
  }

  if (!device.macAddress) {
    throw new RequestError('Device has no MAC address', 400)
  }

  try {
    await wakeOnLan(device.macAddress)
    await getDataSetFor(injector, DeviceAwakeHistory, 'id').add(injector, {
      id: `${device.name}-${Date.now()}`,
      name: device.name,
      success: true,
      createdAt: new Date().toISOString(),
    })
    return JsonResult({ success: true })
  } catch (error) {
    await getDataSetFor(injector, DeviceAwakeHistory, 'id').add(injector, {
      id: `${device.name}-${Date.now()}`,
      name: device.name,
      success: false,
      createdAt: new Date().toISOString(),
    })
    return JsonResult({ success: false })
  }
}
