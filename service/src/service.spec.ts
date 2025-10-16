import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { PiRatRootService } from './service.js'

describe('Service', () => {
  it('should be initialized', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const instance = injector.getInstance(PiRatRootService)
      await new Promise((resolve) => instance.addListener('initialized', resolve))

      expect(instance).toBeDefined()
    })
  })
})
