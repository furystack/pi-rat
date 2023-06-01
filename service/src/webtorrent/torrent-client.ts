import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import WebTorrent from 'webtorrent'
import { getDataFolder } from '../get-data-folder.js'
import { extname, join } from 'path'
import { readFile, readdir } from 'fs/promises'
import type { ApiTorrent, TorrentConfig } from 'common'
import { Drive } from 'common'
import { Config } from 'common'
import { getLogger } from '@furystack/logging'
import { StoreManager } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'

@Injectable({ lifetime: 'singleton' })
export class TorrentClient extends WebTorrent {
  public readonly torrentsPath = join(getDataFolder(), 'torrents')
  public readonly inProgressPath = join(this.torrentsPath, 'in-progress')

  private config?: TorrentConfig
  private physicalPath!: string

  public getPhysicalPath = () => this.physicalPath

  public getConfig = () => this.config

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
      pieceLength: torrent.pieceLength,
      pieces: torrent.pieces.map((piece) => (piece ? { length: piece.length, missing: piece.missing } : null)),
      progress: torrent.progress,
      ratio: torrent.ratio,
      received: torrent.received,
      ready: torrent.ready,
      timeRemaining: torrent.timeRemaining,
      uploaded: torrent.uploaded,
      uploadSpeed: torrent.uploadSpeed,
      paused: torrent.paused,
    }
  }

  private setupReinitTriggers(injector: Injector) {
    const configDataSet = getDataSetFor(injector, Config, 'id')
    const onAdd = configDataSet.onEntityAdded.subscribe(async ({ entity }) => {
      if (entity.id === 'TORRENT_CONFIG') {
        onAdd.dispose()
        onUpdate.dispose()
        onRemove.dispose()
        this.init(injector)
      }
    })
    const onUpdate = configDataSet.onEntityUpdated.subscribe(async ({ id }) => {
      if (id === 'TORRENT_CONFIG') {
        onAdd.dispose()
        onUpdate.dispose()
        onRemove.dispose()
        this.init(injector)
      }
    })
    const onRemove = configDataSet.onEntityRemoved.subscribe(async ({ key }) => {
      if (key === 'TORRENT_CONFIG') {
        onAdd.dispose()
        onUpdate.dispose()
        onRemove.dispose()
        this.init(injector)
      }
    })
  }

  public async init(injector: Injector) {
    const logger = getLogger(injector).withScope('TorrentClient config')

    this.setupReinitTriggers(injector)

    await logger.verbose({ message: '🫴  Setting up Torrents...' })

    const storeManager = injector.getInstance(StoreManager)

    const config = await storeManager.getStoreFor<TorrentConfig, 'id'>(Config as any, 'id').get('TORRENT_CONFIG')

    if (!config) {
      this.config = undefined
      return logger.warning({ message: "❗ No torrent config found, torrents won't be initialized" })
    }

    this.config = config as TorrentConfig

    const { torrentDriveLetter, torrentPath } = config.value

    const drive = await storeManager.getStoreFor(Drive, 'letter').get(torrentDriveLetter)

    if (!drive) {
      return logger.warning({
        message: `❗ No drive found for letter ${torrentDriveLetter}, torrents won't be initialized`,
      })
    }

    this.physicalPath = join(drive?.physicalPath, torrentPath)

    await Promise.all(
      this.torrents.map(
        (torrent) =>
          new Promise<void>((resolve, reject) =>
            torrent.destroy({ destroyStore: false }, (err) => (err ? reject(err) : resolve())),
          ),
      ),
    )

    const torrentFiles = await readdir(this.torrentsPath)
    const inProgressFiles = await readdir(this.inProgressPath)

    await Promise.all([
      inProgressFiles
        .filter((file) => extname(file) === '.torrent')
        .map(async (file) => {
          console.log('Adding running torrent', file)
          const fileContent = await readFile(join(this.inProgressPath, file))
          this.add(fileContent, { path: this.physicalPath })
        }),
    ])

    await Promise.all([
      torrentFiles
        .filter((file) => extname(file) === '.torrent')
        .map(async (file) => {
          console.log('Adding paused torrent', file)
          const fileContent = await readFile(join(this.torrentsPath, file))
          const instance = this.add(fileContent, { path: this.physicalPath })
          instance.pause()
        }),
    ])
  }
}
