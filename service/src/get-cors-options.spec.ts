import { getCorsOptions } from './get-cors-options'

describe('getCorsOptions', () => {
  it('Should match the default options', () => {
    expect(getCorsOptions()).toEqual({
      credentials: true,
      origins: ['http://localhost:8080'],
      headers: ['cache', 'content-type'],
    })
  })
})
