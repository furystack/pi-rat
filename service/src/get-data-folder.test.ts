import { join } from 'path'
import { getDataFolder } from './get-data-folder'
import { describe, it } from 'node:test'
import { strictEqual } from 'node:assert/strict'

describe('getDataFolder', () => {
  it('should use the env by default', () => {
    const dataFolder = getDataFolder()
    strictEqual(dataFolder, join(process.cwd(), 'data'))
  })

  it('should use the default if not defined in env', () => {
    const dataFolder = getDataFolder({})
    strictEqual(dataFolder, join(process.cwd(), 'data'))
  })

  it('should use the defined value from env', () => {
    const dataFolder = getDataFolder({ DATA_FOLDER: '/temp/asd' })
    strictEqual(dataFolder, '/temp/asd')
  })
})
