import { Injectable, Injected } from '@furystack/inject'
import { TorrentsApiClient } from './api-clients/torrents-api-client.js'
import { Cache } from '@furystack/cache'
import { environmentOptions } from '../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class TorrentService {
  @Injected(TorrentsApiClient)
  private readonly torrentsApiClient!: TorrentsApiClient

  public torrentsCache = new Cache({
    capacity: 100,
    load: async () => {
      const { result } = await this.torrentsApiClient.call({
        method: 'GET',
        action: '/torrents',
      })
      return result
    },
  })

  public getTorrents = this.torrentsCache.get.bind(this.torrentsCache)

  public getTorrentsAsObservable = this.torrentsCache.getObservable.bind(this.torrentsCache)

  public uploadTorrents = async (...files: File[]) => {
    if (files.some((file) => !file.name.endsWith('.torrent'))) {
      throw new Error('Only .torrent files are allowed')
    }
    const formData = new FormData()
    files.forEach((file) => formData.append('torrents', file))

    await fetch(`${environmentOptions.serviceUrl}/torrent/torrents`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  }

  public async resumeTorrent(torrentId: string) {
    await this.torrentsApiClient.call({
      method: 'POST',
      action: `/torrents/:id/resume`,
      url: { id: torrentId },
    })
  }

  public async pauseTorrent(torrentId: string) {
    await this.torrentsApiClient.call({
      method: 'POST',
      action: `/torrents/:id/pause`,
      url: { id: torrentId },
    })
  }

  public async deleteTorrent(torrentId: string, deleteFiles = false) {
    await this.torrentsApiClient.call({
      method: 'DELETE',
      action: `/torrents/:id`,
      url: { id: torrentId },
      query: { deleteFiles },
    })
  }
}
