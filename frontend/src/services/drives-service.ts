import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { EventHub, PathHelper } from '@furystack/utils'
import type { Drive, FileChangeMessage, WebsocketMessage } from 'common'
import { DrivesApiClient } from './api-clients/drives-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

class DrivesServiceImpl extends EventHub<{ onFilesystemChanged: FileChangeMessage }> implements Disposable {
  public volumesCache = new Cache({
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

  private fileListCache = new Cache({
    load: async (letter: string, path: string) => {
      const { result } = await this.drivesApiClient
        .call({
          method: 'GET',
          action: '/files/:letter/:path',
          url: { letter, path },
        })
        .then((response) => ({
          ...response,
          result: {
            ...response.result,
            entries: response.result.entries.sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1
              if (!a.isDirectory && b.isDirectory) return 1
              return a.name.localeCompare(b.name)
            }),
          },
        }))
      return { ...result, letter, path }
    },
  })

  constructor(
    private readonly drivesApiClient: DrivesApiClient,
    private readonly socket: WebsocketNotificationsService,
  ) {
    super()
  }

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
    this.volumesCache.obsoleteRange(() => true)
    return addResult
  }

  public updateVolume = async (letter: string, volume: Omit<Drive, 'letter' | 'createdAt' | 'updatedAt'>) => {
    await this.drivesApiClient.call({
      method: 'PATCH',
      action: '/volumes/:id',
      url: { id: letter },
      body: volume,
    })
    this.volumesCache.obsoleteRange(() => true)
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

  public getFileList = this.fileListCache.get.bind(this.fileListCache)
  public getFileListAsObservable = this.fileListCache.getObservable.bind(this.fileListCache)

  public removeFile = async ({ letter, path }: { letter: string; path: string }) => {
    return this.drivesApiClient.call({
      method: 'DELETE',
      action: '/files/:letter/:path',
      url: { letter, path },
    })
  }

  private onMessage = ((messageData: WebsocketMessage) => {
    if (messageData.type === 'file-change') {
      this.emit('onFilesystemChanged', messageData)

      this.fileListCache.obsoleteRange((fileList) => {
        const rootPath = PathHelper.getParentPath(messageData.path)
        const parentPath = rootPath === messageData.path ? '' : rootPath
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

  public [Symbol.dispose](): void {
    try {
      this.socket.removeListener('onMessage', this.onMessage)
    } catch {
      // Socket may already be disposed
    }
    this.volumesCache[Symbol.dispose]()
    this.singleVolumeCache[Symbol.dispose]()
    this.fileListCache[Symbol.dispose]()
    super[Symbol.dispose]()
  }
}

export type DrivesService = DrivesServiceImpl

export const DrivesService: Token<DrivesService, 'singleton'> = defineService({
  name: 'pi-rat/DrivesService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new DrivesServiceImpl(inject(DrivesApiClient), inject(WebsocketNotificationsService))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
