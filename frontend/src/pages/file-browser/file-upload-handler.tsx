import { createComponent } from '@furystack/shades'
import type { NotyService } from '@furystack/shades-common-components'

import type { SessionService } from '../../services/session.js'
import { getErrorMessage } from '../../services/get-error-message.js'
import { environmentOptions } from '../../utils/environment-options.js'

export const handleFileDrop = async ({
  ev,
  sessionService,
  notyService,
  currentDriveLetter,
  currentPath,
}: {
  ev: DragEvent
  sessionService: SessionService
  notyService: NotyService
  currentDriveLetter: string
  currentPath: string
}) => {
  ev.preventDefault()
  if (!ev.dataTransfer?.files) return

  if (!(await sessionService.isAuthorized('admin'))) {
    return notyService.emit('onNotyAdded', {
      type: 'warning',
      title: 'Not authorized',
      body: <>You are not authorized to upload files</>,
    })
  }

  const formData = new FormData()
  for (const file of ev.dataTransfer.files) {
    formData.append('uploads', file)
  }

  await fetch(
    `${environmentOptions.serviceUrl}/drives/volumes/${encodeURIComponent(
      currentDriveLetter,
    )}/${encodeURIComponent(currentPath)}/upload`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    },
  )
    .then(() => {
      notyService.emit('onNotyAdded', {
        type: 'success',
        title: 'Upload completed',
        body: <>The files are upploaded succesfully</>,
      })
    })
    .catch((err) =>
      notyService.emit('onNotyAdded', {
        title: 'Upload failed',
        body: <>{getErrorMessage(err)}</>,
        type: 'error',
      }),
    )
}
