import type { OmdbConfig } from './omdb-config.js'
import type { GithubConfig } from './github-config.js'
import type { TorrentConfig } from './torrent-config.js'

export type ConfigType = OmdbConfig | GithubConfig | TorrentConfig

export class Config {
  id!: ConfigType['id']
  value!: ConfigType['value']

  declare createdAt: Date
  declare updatedAt: Date
}
