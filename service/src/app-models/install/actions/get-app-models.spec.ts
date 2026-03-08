import { Injector } from '@furystack/inject'
import { useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import type { AppModelManifest } from 'common'
import { AppModelManager } from '../../../AppModelManager.js'
import { GetAppModels } from './get-app-models.js'

const createManifest = (id: string): AppModelManifest => ({
  id,
  name: id,
  description: '',
  apiRedirects: {},
  integrations: {},
  requiredPermissions: {},
  version: '0.0.1',
})

const callAction = async (injector: Injector) => {
  const actionContext = {
    injector,
    getBody: async () => ({}),
    getQuery: () => ({}),
    getUrlParams: () => ({}),
    headers: {},
  } as unknown as Parameters<typeof GetAppModels>[0]

  const result = await GetAppModels(actionContext)
  return result as { chunk: unknown; statusCode: number }
}

describe('GetAppModels', () => {
  it('should return an empty list when no app models are registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      injector.getInstance(AppModelManager)

      const result = await callAction(injector)

      expect(result.chunk).toEqual([])
      expect(result.statusCode).toBe(200)
    })
  })

  it('should return registered app models with their manifests and states', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useLogging(injector, VerboseConsoleLogger)
      const manager = injector.getInstance(AppModelManager)

      await manager.registerInternalAppModels({
        manifest: createManifest('test-1'),
        state: { type: 'initializing' },
      })

      const result = await callAction(injector)
      const body = result.chunk as Array<{ manifest: AppModelManifest; state: { type: string } }>

      expect(body).toHaveLength(1)
      expect(body[0].manifest.id).toBe('test-1')
      expect(body[0].state.type).toBe('running')
    })
  })
})
