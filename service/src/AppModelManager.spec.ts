import { Injector } from '@furystack/inject'
import { useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { entitySyncConfig, type AppModelManifest, type InternalAppModel } from 'common'
import { AppModelManager } from './AppModelManager.js'

const createManifest = (id: string, name?: string): AppModelManifest => ({
  id,
  name: name ?? id,
  description: '',
  apiRedirects: {},
  integrations: {},
  requiredPermissions: {},
  version: '0.0.1',
})

const createAppModel = (overrides: Partial<InternalAppModel> = {}): InternalAppModel => ({
  manifest: createManifest('test-model', 'Test Model'),
  state: { type: 'initializing' },
  ...overrides,
})

describe('AppModelManager', () => {
  it('should register an app model and set state to running', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)
      const appModel = createAppModel()

      await manager.registerInternalAppModels(appModel)

      expect(manager.appModels.size).toBe(1)
      expect(manager.appModels.get('test-model')?.state.type).toBe('running')
    })
  })

  it('should throw when registering a duplicate app model id', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)

      const model1 = createAppModel()
      const model2 = createAppModel()

      await manager.registerInternalAppModels(model1)
      await expect(manager.registerInternalAppModels(model2)).rejects.toThrow(
        'App model with id test-model is already registered',
      )
    })
  })

  it('should set state to error when setup() throws', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)

      const appModel = createAppModel({
        setup: async () => {
          throw new Error('Setup failed')
        },
      })

      await manager.registerInternalAppModels(appModel)

      const registered = manager.appModels.get('test-model')
      expect(registered?.state).toEqual({ type: 'error', error: 'Setup failed' })
    })
  })

  it('should call setup() on the app model', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)

      const setup = vi.fn()
      const appModel = createAppModel({ setup })

      await manager.registerInternalAppModels(appModel)

      expect(setup).toHaveBeenCalledOnce()
    })
  })

  it('should register multiple app models', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)

      const model1 = createAppModel({ manifest: createManifest('model-1') })
      const model2 = createAppModel({ manifest: createManifest('model-2') })

      await manager.registerInternalAppModels(model1, model2)

      expect(manager.appModels.size).toBe(2)
      expect(manager.appModels.get('model-1')?.state.type).toBe('running')
      expect(manager.appModels.get('model-2')?.state.type).toBe('running')
    })
  })

  describe('getEntitySyncModels', () => {
    it('should return empty array when no models have entity sync', async () => {
      await usingAsync(new Injector(), async (injector) => {
        useLogging(injector, VerboseConsoleLogger)
        const manager = injector.getInstance(AppModelManager)

        await manager.registerInternalAppModels(createAppModel())

        expect(manager.getEntitySyncModels()).toEqual([])
      })
    })

    it('should aggregate entity sync models from all registered app models', async () => {
      await usingAsync(new Injector(), async (injector) => {
        useLogging(injector, VerboseConsoleLogger)
        const manager = injector.getInstance(AppModelManager)

        class EntityA {
          declare id: string
        }
        class EntityB {
          declare name: string
        }

        const model1 = createAppModel({
          manifest: createManifest('model-1'),
          getEntitySyncModels: () => [entitySyncConfig({ model: EntityA, primaryKey: 'id' })],
        })
        const model2 = createAppModel({
          manifest: createManifest('model-2'),
          getEntitySyncModels: () => [entitySyncConfig({ model: EntityB, primaryKey: 'name', debounceMs: 200 })],
        })

        await manager.registerInternalAppModels(model1, model2)

        const syncModels = manager.getEntitySyncModels()
        expect(syncModels).toHaveLength(2)
        expect(syncModels[0].model).toBe(EntityA)
        expect(syncModels[1].model).toBe(EntityB)
        expect(syncModels[1].debounceMs).toBe(200)
      })
    })
  })
})
