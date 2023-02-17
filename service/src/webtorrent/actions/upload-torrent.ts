import { isAuthorized } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { UploadTorrentEndpoint } from 'common'
import { WebTorrentEntity } from 'common'
import { Fields, Files } from 'formidable'
import IncomingForm from 'formidable/Formidable'
import WebTorrent from 'webtorrent'

export const UploadTorrentAction: RequestAction<UploadTorrentEndpoint> = async ({ injector, request }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new RequestError('Unauthorized', 401)
  }

  const logger = getLogger(injector).withScope('UploadTorrentAction')

  const dataSet = getDataSetFor(injector, WebTorrentEntity, 'id')
  const torrentClient = injector.getInstance(WebTorrent)

  const form = new IncomingForm({
    keepExtensions: true,
    multiples: true,
    minFileSize: 1,
    filename: (name, ext) => `${name}${ext}`,
  })

  form.on('file', (formName, file) => {
    logger.debug({ message: `Uploading File '${file.originalFilename}'`, data: { formName, file } })
  })

  const parseResult = await new Promise<{ files: Files; fields: Fields }>((resolve, reject) => {
    try {
      form.parse(request, (err, fields, files) => {
        if (err) {
          return reject(err)
        }
        resolve({ fields, files })
      })
    } catch (error) {
      reject(error)
    }
  })

  const files = Object.values(parseResult?.files || [])
    .flatMap((f) => f)
    .map((f) => f.filepath)

  files.forEach((file) => torrentClient.add(file))

  return JsonResult({ entries: [], success: true })
}
