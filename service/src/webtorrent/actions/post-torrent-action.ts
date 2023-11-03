import { isAuthorized } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { UploadTorrentEndpoint } from 'common'
import { TorrentClient } from '../torrent-client.js'
import type { Fields, File, Files } from 'formidable'
import { IncomingForm } from 'formidable'

export const PostTorrentAction: RequestAction<UploadTorrentEndpoint> = async ({ injector, request }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new RequestError('Unauthorized', 401)
  }

  const torrentClient = injector.getInstance(TorrentClient)

  const logger = getLogger(injector).withScope('PostTorrentAction')

  const targetPath = torrentClient.inProgressPath

  const form = new IncomingForm({
    uploadDir: targetPath,
    keepExtensions: true,
    multiples: true,
    minFileSize: 1,
    filename: (name, ext) => `${name}${ext}`,
  })

  form.on('file', (formName, file) => {
    logger.debug({ message: `Uploading File '${file.originalFilename}'`, data: { formName, file } })
  })

  // TODO: Implement response parsing
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

  logger.debug({ message: 'Upload finished', data: parseResult })

  const fileArray: File[] = Object.values(parseResult.files).flatMap((value) => value)

  const entries = fileArray
    .filter((file) => file.mimetype === 'application/x-bittorrent')
    .map((file) =>
      torrentClient.add(file.filepath, {
        path: torrentClient.getPhysicalPath(),
      }),
    )
    .map((torrent) => torrentClient.toApiTorrent(torrent))

  return JsonResult({ success: true, entries })
}
