import { Injectable } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { environmentOptions } from '../environment-options'

type DrivesFilesystemChangedEvent = {
  type: 'file-change'
  /**
   * The type of the filesystem event
   */
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'
  /**
   * The relative path of the changed file
   */
  path: string
  /**
   * The drive letter
   */
  drive: string
}

@Injectable({ lifetime: 'singleton' })
export class DrivesFilesystemNotificationsService {
  public readonly onFilesystemChanged = new ObservableValue<DrivesFilesystemChangedEvent>()

  public socket = new WebSocket(`${environmentOptions.serviceUrl}/ws`.replace('http', 'ws'))

  public dispose() {
    this.socket.close()
  }

  constructor() {
    this.socket.onmessage = (ev) => {
      const messageData = JSON.parse(ev.data)
      if (messageData.type === 'file-change') {
        this.onFilesystemChanged.setValue(messageData)
      }
    }
  }
}
