import type { RestApi } from '@furystack/rest'

export interface ApiTorrentFile {
  name: string
  path: string
  length: number
  downloaded: number
  progress: number
}

export interface ApiTorrentPiece {
  length: number
  missing: number
}

export interface ApiTorrent {
  infoHash: string
  magnetURI: string
  torrentFile: Buffer
  torrentFileBlobURL: string
  files: ApiTorrentFile[]
  announce: string[]
  ['announce-list']: string[][]
  pieces: Array<ApiTorrentPiece | null>
  timeRemaining: number
  received: number
  downloaded: number
  uploaded: number
  downloadSpeed: number
  uploadSpeed: number
  progress: number
  ratio: number
  length: number
  pieceLength: number
  lastPieceLength: number
  numPeers: number
  path: string
  ready: boolean
  paused: boolean
  done: boolean
  name: string
  created: Date
  createdBy: string
  comment: string
  maxWebConns: number
}

export type UploadTorrentEndpoint = {
  result: { success: true; entries: ApiTorrent[] }
  body: any
}

export type PauseTorrentEndpoint = {
  path: { id: string }
  result: { success: true }
}

export type ResumeTorrentEndpoint = {
  path: { id: string }
  result: { success: true }
}

export type DeleteTorrentEndpoint = {
  path: { id: string }
  query: { deleteFiles: boolean }
  result: { success: true }
}

export interface TorrentApi extends RestApi {
  GET: {
    '/torrents': { result: ApiTorrent[] }
  }
  POST: {
    '/torrents': UploadTorrentEndpoint
    '/torrents/:id/pause': PauseTorrentEndpoint
    '/torrents/:id/resume': ResumeTorrentEndpoint
  }
  DELETE: {
    '/torrents/:id': DeleteTorrentEndpoint
  }
}
