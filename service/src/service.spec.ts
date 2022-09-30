import { init } from './service'
import { injector as rootInjector } from './root-injector'

describe('Service', () => {
  it('should be initialized with the root injector', async () => {
    const i = await init()

    expect(i).toBe(rootInjector)

    await rootInjector.dispose()
  })
})
