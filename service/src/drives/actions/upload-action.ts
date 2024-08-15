import { isAuthorized } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { DirectoryEntry, UploadEndpoint } from 'common'
import { Drive } from 'common'
import type { Fields, Files } from 'formidable'
import { IncomingForm } from 'formidable'
import { join } from 'path'
import { existsAsync } from '../../utils/exists-async.js'
import { createDirentListFromFiles } from '../create-dirent-list-from-files.js'

export const UploadAction: RequestAction<UploadEndpoint> = async ({ injector, getUrlParams, request }) => {
  if (!(await isAuthorized(injector, 'admin'))) {
    throw new RequestError('Unauthorized', 401)
  }

  const logger = getLogger(injector).withScope('UploadAction')
  const { letter, path } = getUrlParams()
  await logger.verbose({ message: `Uploading file to ${letter}:${path}` })

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
    void logger.debug({ message: `Uploading File '${file.originalFilename}'`, data: { formName, file } })
  })

  // TODO: Implement response parsing
  const parseResult = await new Promise<{ files: Files; fields: Fields }>((resolve, reject) => {
    try {
      form.parse(request, (err, fields, files) => {
        if (err) {
          return reject(err as Error)
        }
        resolve({ fields, files })
      })
    } catch (error) {
      reject(error as Error)
    }
  })

  await logger.debug({ message: 'Upload finished', data: parseResult })

  const createdEntries: DirectoryEntry[] = createDirentListFromFiles(parseResult.files)

  return JsonResult({ success: true, entries: createdEntries })
}
