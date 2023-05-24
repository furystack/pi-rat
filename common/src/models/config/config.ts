import type { OmdbConfig } from './omdb-config.js'
import type { GithubConfig } from './github-config.js'
import type { TorrentConfig } from './torrent-config.js'

export type ConfigType = OmdbConfig | GithubConfig | TorrentConfig

export class Config {
  type!: ConfigType['type']
  value!: ConfigType['value']
  id!: string

  declare createdAt: Date
  declare updatedAt: Date
}
