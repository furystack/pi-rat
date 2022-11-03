import type { ScopedLogger } from '@furystack/logging'
import { join } from 'path'
import type { Options } from 'sequelize'
import sqlite from 'sqlite3'
import { getDataFolder } from './get-data-folder'

export const getDefaultDbSettings = (fileName: string, logger: ScopedLogger): Options => ({
  dialect: 'sqlite',
  dialectModule: sqlite,
  storage: join(getDataFolder(), fileName),
  logging(sql, timing?) {
    logger.verbose({ message: `🗄️  ${sql}`, data: { timing, sql } })
  },
})
