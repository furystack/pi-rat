import { AuthorizationError, isAuthorized } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { Device, DevicePingHistory, type PingEndpoint } from '@pi-rat/iot-common'
import ping from 'ping'

export const PingAction: RequestAction<PingEndpoint> = async ({ injector, getUrlParams }) => {
  if (!(await isAuthorized(injector, 'admin'))) {
    throw new AuthorizationError('Needs admin access')
  }

  const { id } = getUrlParams()
  const device = await getDataSetFor(injector, Device, 'name').get(injector, id)

  if (!device) {
    throw new RequestError(`device with name '${id}' not found`, 404)
  }

  const { ipAddress } = device

  if (!ipAddress) {
    throw new RequestError(`device with name '${id}' has no ip address`, 400)
  }

  const result = await ping.promise.probe(ipAddress)

  const { alive, time } = result

  const pingEntry = await getDataSetFor(injector, DevicePingHistory, 'id').add(injector, {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: device.name,
    isAvailable: alive,
    ping: isNaN(time) ? 0 : time,
  })

  return JsonResult({ success: true, ...pingEntry.created[0] })
}
