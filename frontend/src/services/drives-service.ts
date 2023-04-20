import { Injectable, Injected } from '@furystack/inject'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { ObservableValue, PathHelper } from '@furystack/utils'
import { Cache } from '@furystack/cache'
import { DrivesApiClient } from './drives-api-client'
import type { Drive } from 'common'
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
export class DrivesService {
  @Injected(DrivesApiClient)
  private readonly drivesApiClient!: DrivesApiClient

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
      const { result } = await this.drivesApiClient.call({
        method: 'GET',
        action: '/files/:letter/:path',
        url: { letter, path: encodeURIComponent(path) },
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
    this.fileListCache.flushAll()
    return removeResult
  }

  public readonly onFilesystemChanged = new ObservableValue<DrivesFilesystemChangedEvent>()

  private readonly wsUrl = new URL(`${environmentOptions.serviceUrl}/ws`, window.location.href)

  public socket = new WebSocket(this.wsUrl.toString().replace('http', 'ws'))

  public dispose() {
    this.socket.close()
  }

  constructor() {
    this.socket.onmessage = (ev) => {
      const messageData = JSON.parse(ev.data)
      if (messageData.type === 'file-change') {
        this.onFilesystemChanged.setValue(messageData)

        this.fileListCache.obsoleteRange((fileList) => {
          const parentPath = PathHelper.getParentPath(messageData.path)
          const currentPath = PathHelper.normalize(fileList.path)
          return (
            fileList.letter === messageData.drive &&
            (currentPath === parentPath || (!currentPath && PathHelper.normalize(messageData.path)) === parentPath)
          )
        })
      }
    }
  }
}
