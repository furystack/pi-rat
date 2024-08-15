import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { EventHub, PathHelper } from '@furystack/utils'
import type { Drive, WebsocketMessage } from 'common'
import type { FileChangeMessage } from '../../../common/src/websocket/file-change-message.js'
import { DrivesApiClient } from './api-clients/drives-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

@Injectable({ lifetime: 'singleton' })
export class DrivesService extends EventHub<{ onFilesystemChanged: FileChangeMessage }> {
  @Injected(DrivesApiClient)
  private declare readonly drivesApiClient: DrivesApiClient

  private volumesCache = new Cache({
    load: async ({ findOptions }: { findOptions?: FindOptions<Drive, Array<keyof Drive>> }) => {
      const { result } = await this.drivesApiClient.call({
        method: 'GET',
        action: '/volumes',
        query: { findOptions },
      })
      return result
    },
  })

  private singleVolumeCache = new Cache({
    load: async (id: string, query?: { select?: Array<keyof Drive> }) => {
      const { result } = await this.drivesApiClient.call({
        method: 'GET',
        action: '/volumes/:id',
        url: { id },
        query: query || {},
      })
      return result
    },
  })

  public getVolumes = this.volumesCache.get.bind(this.volumesCache)
  public getVolumesAsObservable = this.volumesCache.getObservable.bind(this.volumesCache)

  public getVolume = this.singleVolumeCache.get.bind(this.singleVolumeCache)

  public getVolumeAsObservable = this.singleVolumeCache.getObservable.bind(this.singleVolumeCache)

  public addVolume = async (volume: Omit<WithOptionalId<Drive, 'letter'>, 'createdAt' | 'updatedAt'>) => {
    const addResult = await this.drivesApiClient.call({
      method: 'POST',
      action: '/volumes',
      body: volume,
    })
    this.volumesCache.flushAll()
    return addResult
  }

  public updateVolume = async (letter: string, volume: Omit<Drive, 'letter' | 'createdAt' | 'updatedAt'>) => {
    await this.drivesApiClient.call({
      method: 'PATCH',
      action: '/volumes/:id',
      url: { id: letter },
      body: volume,
    })
    this.volumesCache.flushAll()
    this.singleVolumeCache.obsoleteRange((drive) => drive.letter === letter)
  }

  public removeVolume = async (letter: string) => {
    const removeResult = await this.drivesApiClient.call({
      method: 'DELETE',
      action: '/volumes/:id',
      url: { id: letter },
    })
    this.volumesCache.flushAll()
    this.singleVolumeCache.removeRange((drive) => drive.letter === letter)
    return removeResult
  }

  private fileListCache = new Cache({
    load: async (letter: string, path: string) => {
      const { result } = await this.drivesApiClient
        .call({
          method: 'GET',
          action: '/files/:letter/:path',
          url: { letter, path },
        })
        .then((response) => {
          const orderedResult: typeof response = {
            ...response,
            result: {
              ...response.result,
              entries: response.result.entries.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) {
                  return -1
                }
                if (!a.isDirectory && b.isDirectory) {
                  return 1
                }
                return a.name.localeCompare(b.name)
              }),
            },
          }
          return orderedResult
        })
      return { ...result, letter, path }
    },
  })

  public getFileList = this.fileListCache.get.bind(this.fileListCache)

  public getFileListAsObservable = this.fileListCache.getObservable.bind(this.fileListCache)

  public removeFile = async (letter: string, path: string) => {
    const removeResult = await this.drivesApiClient.call({
      method: 'DELETE',
      action: '/files/:letter/:path',
      url: { letter, path },
    })
    return removeResult
  }

  @Injected(WebsocketNotificationsService)
  private declare readonly socket: WebsocketNotificationsService

  private onMessage = ((messageData: WebsocketMessage) => {
    if (messageData.type === 'file-change') {
      this.emit('onFilesystemChanged', messageData as FileChangeMessage)

      this.fileListCache.obsoleteRange((fileList) => {
        const parentPath = PathHelper.getParentPath(messageData.path)
        const currentPath = PathHelper.normalize(fileList.path)
        return (
          fileList.letter === messageData.drive &&
          (currentPath === parentPath || (!currentPath && PathHelper.normalize(messageData.path)) === parentPath)
        )
      })
    }
  }).bind(this)

  public init() {
    this.socket.addListener('onMessage', this.onMessage)
  }

  public dispose() {
    this.socket.removeListener('onMessage', this.onMessage)
  }
}
