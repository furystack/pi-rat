import type { OmdbConfig } from './omdb-config.js'
import type { GithubConfig } from './github-config.js'

export type ConfigType = OmdbConfig | GithubConfig

export class Config {
  type!: ConfigType['type']
  value!: ConfigType['value']
  id!: string

  declare createdAt: Date
  declare updatedAt: Date
}
