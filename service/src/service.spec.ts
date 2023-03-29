import { init } from './service'
import { injector as rootInjector } from './root-injector'
import { describe, it } from 'node:test'
import { equal } from 'node:assert'

describe('Service', () => {
  it('should be initialized with the root injector', async () => {
    const i = await init()

    equal(i, rootInjector)

    await rootInjector.dispose()
  })
})
