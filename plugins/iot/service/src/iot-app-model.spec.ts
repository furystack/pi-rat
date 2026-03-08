import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { IotAppModel } from './iot-app-model.js'

const createMinimalOptions = () => ({
  port: 8080,
  cors: { origins: ['http://localhost'] },
  getDbSettings: vi.fn(),
  withRole: vi.fn(),
  announce: vi.fn(),
})

describe('IotAppModel', () => {
  it('should have initializing state by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const appModel = injector.getInstance(IotAppModel)
      expect(appModel.state.type).toBe('initializing')
    })
  })

  it('should have the IoT manifest', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const appModel = injector.getInstance(IotAppModel)
      expect(appModel.manifest.id).toBe('@pi-rat/iot')
      expect(appModel.manifest.name).toBe('IOT')
    })
  })

  it('should return this from configure() for chaining', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const appModel = injector.getInstance(IotAppModel)
      const result = appModel.configure(createMinimalOptions())
      expect(result).toBe(appModel)
    })
  })

  it('should throw when setup() is called before configure()', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const appModel = injector.getInstance(IotAppModel)
      await expect(appModel.setup()).rejects.toThrow('IotAppModel.configure() must be called before setup()')
    })
  })

  it('should implement InternalAppModel interface', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const appModel = injector.getInstance(IotAppModel)
      expect(appModel).toHaveProperty('manifest')
      expect(appModel).toHaveProperty('state')
      expect(appModel).toHaveProperty('setup')
    })
  })
})
