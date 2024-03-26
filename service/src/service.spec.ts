import { injector as rootInjector } from './root-injector'
import { PiRatRootService } from './service.js'
import { describe, expect, it } from 'vitest'

describe('Service', () => {
  it('should be initialized', async () => {
    const instance = rootInjector.getInstance(PiRatRootService)
    await new Promise((resolve) => instance.addListener('initialized', resolve))

    expect(instance).toBeDefined()

    await rootInjector.dispose()
  })
})
