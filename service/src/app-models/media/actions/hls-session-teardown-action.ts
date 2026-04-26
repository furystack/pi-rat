import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { JsonResult } from '@furystack/rest-service'
import type { RequestAction } from '@furystack/rest-service'
import type { HlsSessionTeardownEndpoint } from 'common'
import { TranscodingSessionService } from '../services/transcoding-session.js'

export const HlsSessionTeardownAction: RequestAction<HlsSessionTeardownEndpoint> = async ({
  injector,
  getUrlParams,
}) => {
  const logger = getLogger(injector).withScope('HlsSessionTeardownAction')
  const { letter, path } = getUrlParams()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const sessionService = injector.get(TranscodingSessionService)
  sessionService.removeAllSessionsForFile(letter, path)

  await logger.verbose({
    message: `Tore down HLS sessions for ${letter}:${path}`,
  })

  return JsonResult({ success: true })
}
