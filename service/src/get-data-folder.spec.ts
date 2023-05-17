import { join } from 'path'
import { getDataFolder } from './get-data-folder'
import { describe, expect, it } from 'vitest'

describe('getDataFolder', () => {
  it('should use the env by default', () => {
    const dataFolder = getDataFolder()
    expect(dataFolder).toEqual(join(process.cwd(), 'data'))
  })

  it('should use the default if not defined in env', () => {
    const dataFolder = getDataFolder({})
    expect(dataFolder).toEqual(join(process.cwd(), 'data'))
  })

  it('should use the defined value from env', () => {
    const dataFolder = getDataFolder({ DATA_FOLDER: '/temp/asd' })
    expect(dataFolder).toEqual('/temp/asd')
  })
})
