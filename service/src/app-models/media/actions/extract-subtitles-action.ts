import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { ExtractSubtitles } from 'common'
import { extractSubtitles } from '../utils/extract-subtitles.js'

export const ExtractSubtitlesAction: RequestAction<ExtractSubtitles> = async ({ injector, getBody }) => {
  const file = await getBody()
  await extractSubtitles({ injector, file })

  return JsonResult({ success: true })
}
