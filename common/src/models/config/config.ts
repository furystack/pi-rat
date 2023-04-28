import type { OmdbConfig } from './omdb-config.js'
import type { GithubConfig } from './github-config.js'

export type ConfigType = OmdbConfig | GithubConfig

export class Config {
  id!: string
  value!: ConfigType
  declare createdAt: Date
  declare updatedAt: Date
}
