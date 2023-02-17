import { getLogger } from '@furystack/logging'
import type { RequestAction } from '@furystack/rest-service'
import { RequestError } from '@furystack/rest'
import { JsonResult } from '@furystack/rest-service'
import type { Fields, Files } from 'formidable'
import { IncomingForm } from 'formidable'
import type { UploadEndpoint } from 'common'
import { Drive } from 'common'
import { getDataSetFor } from '@furystack/repository'
import { existsAsync } from '../setup-drives'
import type { DirectoryEntry } from 'common'
import { join } from 'path'
import { createDirentListFromFiles } from '../create-dirent-list-from-files'
import { isAuthorized } from '@furystack/core'

export const UploadAction: RequestAction<UploadEndpoint> = async ({ injector, getUrlParams, request }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new RequestError('Unauthorized', 401)
  }

  const logger = getLogger(injector).withScope('UploadAction')
  const { letter, path } = getUrlParams()
  logger.verbose({ message: `Uploading file to ${letter}:${path}` })

  const dataSet = getDataSetFor(injector, Drive, 'letter')

  const drive = await dataSet.get(injector, letter)

  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const targetPath = join(drive.physicalPath, path)
  const targetPathExists = await existsAsync(targetPath)
  if (!targetPathExists) {
    throw new RequestError(`Target path ${targetPath} does not exists`, 400)
  }

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

  const createdEntries: DirectoryEntry[] = createDirentListFromFiles(parseResult.files)

  return JsonResult({ success: true, entries: createdEntries })
}
