import type { OmdbConfig } from './omdb-config'
import type { GithubConfig } from './github-config'

export type ConfigType = OmdbConfig | GithubConfig

export class Config {
  id!: string
  value!: ConfigType
  declare createdAt: Date
  declare updatedAt: Date
}
