import { Injectable } from '@furystack/inject'
import WebTorrent from 'webtorrent'
import { getDataFolder } from '../get-data-folder.js'
import { extname, join } from 'path'
import { readFile, readdir } from 'fs/promises'
import type { ApiTorrent } from 'common'

@Injectable({ lifetime: 'singleton' })
export class TorrentClient extends WebTorrent {
  private torrentsPath = join(getDataFolder(), 'torrents')

  private inProgressPath = join(this.torrentsPath, 'in-progress')

  public async dispose() {
    await new Promise<void>((resolve, reject) => this.destroy((err) => (err ? reject(err) : resolve())))
  }

  public toApiTorrent(torrent: WebTorrent.Torrent): ApiTorrent {
    return {
      'announce-list': torrent['announce-list'],
      announce: torrent.announce,
      comment: torrent.comment,
      createdBy: torrent.createdBy,
      created: torrent.created,
      done: torrent.done,
      downloaded: torrent.downloaded,
      downloadSpeed: torrent.downloadSpeed,
      files: torrent.files.map((file) => ({
        downloaded: file.downloaded,
        length: file.length,
        name: file.name,
        path: file.path,
        progress: file.progress,
      })),
      infoHash: torrent.infoHash,
      lastPieceLength: torrent.lastPieceLength,
      length: torrent.length,
      magnetURI: torrent.magnetURI,
      maxWebConns: torrent.maxWebConns,
      name: torrent.name,
      numPeers: torrent.numPeers,
      path: torrent.path,
      pieceLength: torrent.pieceLength,
      pieces: torrent.pieces,
      progress: torrent.progress,
      ratio: torrent.ratio,
      received: torrent.received,
      ready: torrent.ready,
      torrentFile: torrent.torrentFile,
      torrentFileBlobURL: torrent.torrentFileBlobURL,
      timeRemaining: torrent.timeRemaining,
      uploaded: torrent.uploaded,
      uploadSpeed: torrent.uploadSpeed,
      paused: torrent.paused,
    }
  }

  public async init() {
    const torrentFiles = readdir(this.torrentsPath)
    const inProgressFiles = readdir(this.inProgressPath)

    await Promise.all([
      (
        await inProgressFiles
      )
        .filter((file) => extname(file) === '.torrent')
        .map(async (file) => {
          console.log('Adding running torrent', file)
          const fileContent = await readFile(join(this.inProgressPath, file))
          this.add(fileContent)
        }),
    ])

    await Promise.all([
      (
        await torrentFiles
      )
        .filter((file) => extname(file) === '.torrent')
        .map(async (file) => {
          console.log('Adding paused torrent', file)
          const fileContent = await readFile(join(this.torrentsPath, file))
          const instance = this.add(fileContent, {})
          instance.pause()
        }),
    ])
  }
}
