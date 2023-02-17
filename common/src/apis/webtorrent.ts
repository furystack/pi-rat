import type { GetCollectionEndpoint, GetEntityEndpoint, RestApi } from '@furystack/rest'
import type { WebTorrentEntity } from '../models/web-torrent-entity'

export type UploadTorrentEndpoint = {
  result: { success: true; entries: WebTorrentEntity[] }
  body: any
}

export type StartTorrentEndpoint = {
  url: {
    id: string
  }
  result: { success: true }
}

export type StopTorrentEndpoint = {
  url: {
    id: string
  }
  result: { success: true }
}

export interface WebTorrentApi extends RestApi {
  GET: {
    '/torrents': GetCollectionEndpoint<WebTorrentEntity>
    '/torrents/:id': GetEntityEndpoint<WebTorrentEntity, 'id'>
  }
  POST: {
    '/torrents': UploadTorrentEndpoint
    '/torrents/:id/start': StartTorrentEndpoint
    '/torrents/:id/stop': StopTorrentEndpoint
  }
}
