import { getCorsOptions } from './get-cors-options'
import { describe, it } from 'node:test'
import { deepStrictEqual } from 'node:assert/strict'

describe('getCorsOptions', () => {
  it('Should match the default options', () => {
    deepStrictEqual(getCorsOptions(), {
      credentials: true,
      origins: ['http://localhost:8080'],
      headers: ['cache', 'content-type'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
  })
})
