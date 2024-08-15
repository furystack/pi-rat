import { AuthorizationError, isAuthorized } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { Device, DevicePingHistory, type PingEndpoint } from 'common'
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

  if (!device.ipAddress) {
    throw new RequestError(`device with name '${id}' has no ip address`, 400)
  }

  const result = await ping.promise.probe(device.ipAddress)

  const pingEntry = await getDataSetFor(injector, DevicePingHistory, 'id').add(injector, {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: device.name,
    isAvailable: result.alive,
    ping: isNaN(result.time as number) ? 0 : parseFloat(result.time as string),
  })

  if (!result.alive) {
    return JsonResult({ success: true, ...pingEntry.created[0] })
  } else {
    return JsonResult({ success: true, ...pingEntry.created[0] })
  }
}
