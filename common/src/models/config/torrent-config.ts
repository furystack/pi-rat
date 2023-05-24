export interface TorrentConfig {
  type: 'TORRENT_CONFIG'
  value: {
    torrentDriveLetter: string
    torrentPath: string
  }
}
