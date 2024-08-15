import type { GithubConfig } from './github-config.js'
import type { IotConfig } from './iot-config.js'
import type { MoviesConfig } from './movies-config.js'
import type { OmdbConfig } from './omdb-config.js'

export type ConfigType = OmdbConfig | GithubConfig | IotConfig | MoviesConfig

export class Config {
  id!: ConfigType['id']
  value!: ConfigType['value']
  declare createdAt: Date
  declare updatedAt: Date
}
