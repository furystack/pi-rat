import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { EventHub, PathHelper } from '@furystack/utils'
import type { Drive, FileChangeMessage, WebsocketMessage } from 'common'
import { DrivesApiClient } from './api-clients/drives-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

const createDrivesService = (drivesApiClient: DrivesApiClient, socket: WebsocketNotificationsService) => {
  const hub = new EventHub<{ onFilesystemChanged: FileChangeMessage }>()
  const disposeHub = hub[Symbol.dispose].bind(hub)

  const volumesCache = new Cache({
    load: async ({ findOptions }: { findOptions?: FindOptions<Drive, Array<keyof Drive>> }) => {
      const { result } = await drivesApiClient.call({
        method: 'GET',
        action: '/volumes',
        query: { findOptions },
      })
      return result
    },
  })

  const singleVolumeCache = new Cache({
    load: async (id: string, query?: { select?: Array<keyof Drive> }) => {
      const { result } = await drivesApiClient.call({
        method: 'GET',
        action: '/volumes/:id',
        url: { id },
        query: query || {},
      })
      return result
    },
  })

  const fileListCache = new Cache({
    load: async (letter: string, path: string) => {
      const { result } = await drivesApiClient
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

  const addVolume = async (volume: Omit<WithOptionalId<Drive, 'letter'>, 'createdAt' | 'updatedAt'>) => {
    const addResult = await drivesApiClient.call({
      method: 'POST',
      action: '/volumes',
      body: volume,
    })
    volumesCache.obsoleteRange(() => true)
    return addResult
  }

  const updateVolume = async (letter: string, volume: Omit<Drive, 'letter' | 'createdAt' | 'updatedAt'>) => {
    await drivesApiClient.call({
      method: 'PATCH',
      action: '/volumes/:id',
      url: { id: letter },
      body: volume,
    })
    volumesCache.obsoleteRange(() => true)
    singleVolumeCache.obsoleteRange((drive) => drive.letter === letter)
  }

  const removeVolume = async (letter: string) => {
    const removeResult = await drivesApiClient.call({
      method: 'DELETE',
      action: '/volumes/:id',
      url: { id: letter },
    })
    volumesCache.flushAll()
    singleVolumeCache.removeRange((drive) => drive.letter === letter)
    return removeResult
  }

  const removeFile = async ({ letter, path }: { letter: string; path: string }) => {
    return drivesApiClient.call({
      method: 'DELETE',
      action: '/files/:letter/:path',
      url: { letter, path },
    })
  }

  const onMessage = (messageData: WebsocketMessage) => {
    if (messageData.type === 'file-change') {
      hub.emit('onFilesystemChanged', messageData)

      fileListCache.obsoleteRange((fileList) => {
        const rootPath = PathHelper.getParentPath(messageData.path)
        const parentPath = rootPath === messageData.path ? '' : rootPath
        const currentPath = PathHelper.normalize(fileList.path)
        return (
          fileList.letter === messageData.drive &&
          (currentPath === parentPath || (!currentPath && PathHelper.normalize(messageData.path)) === parentPath)
        )
      })
    }
  }

  socket.addListener('onMessage', onMessage)

  const dispose = () => {
    try {
      socket.removeListener('onMessage', onMessage)
    } catch {
      // Socket may already be disposed
    }
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    volumesCache[Symbol.dispose]()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    singleVolumeCache[Symbol.dispose]()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    fileListCache[Symbol.dispose]()
    disposeHub()
  }

  return Object.assign(hub, {
    volumesCache,
    getVolumes: volumesCache.get.bind(volumesCache),
    getVolumesAsObservable: volumesCache.getObservable.bind(volumesCache),
    getVolume: singleVolumeCache.get.bind(singleVolumeCache),
    getVolumeAsObservable: singleVolumeCache.getObservable.bind(singleVolumeCache),
    addVolume,
    updateVolume,
    removeVolume,
    getFileList: fileListCache.get.bind(fileListCache),
    getFileListAsObservable: fileListCache.getObservable.bind(fileListCache),
    removeFile,
    [Symbol.dispose]: dispose,
  })
}

export type DrivesService = ReturnType<typeof createDrivesService>

export const DrivesService: Token<DrivesService, 'singleton'> = defineService({
  name: 'pi-rat/DrivesService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = createDrivesService(inject(DrivesApiClient), inject(WebsocketNotificationsService))
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
