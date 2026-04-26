import { join } from 'path'
import type { Options } from 'sequelize'
import sqlite from 'sqlite3'
import { getDataFolder } from './get-data-folder.js'

export const getDefaultDbSettings = (fileName: string): Options => ({
  dialect: 'sqlite',
  dialectModule: sqlite,
  storage: join(getDataFolder(), fileName),
  logging(_sql, _timing?) {
    // verbose: enable to log every SQL statement and timing
  },
})
