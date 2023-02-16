import type { GetCollectionEndpoint, GetEntityEndpoint, RestApi } from '@furystack/rest'
import type { WebTorrent } from '../models/web-torrent'

type UploadTorrentEndpoint = {
  result: { success: true; entries: WebTorrent[] }
  body: any
}

type StartTorrentEndpoint = {
  url: {
    id: string
  }
  result: { success: true }
}

type StopTorrentEndpoint = {
  url: {
    id: string
  }
  result: { success: true }
}

export interface WebTorrentApi extends RestApi {
  GET: {
    '/torrents': GetCollectionEndpoint<WebTorrent>
    '/torrents/:id': GetEntityEndpoint<WebTorrent, 'id'>
  }
  POST: {
    '/torrents': UploadTorrentEndpoint
    '/torrents/:id/start': StartTorrentEndpoint
    '/torrents/:id/stop': StopTorrentEndpoint
  }
}
