import { getCorsOptions } from './get-cors-options'
import { describe, expect, it } from 'vitest'

describe('getCorsOptions', () => {
  it('Should match the default options', () => {
    expect(getCorsOptions()).toEqual({
      credentials: true,
      origins: ['http://localhost:8080'],
      headers: ['cache', 'content-type'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
  })
})
