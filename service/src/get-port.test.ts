import { getPort } from './get-port'
import { describe, it } from 'node:test'
import { equal } from 'node:assert'

describe('getPort', () => {
  it('Should return the default 9090 from env', () => {
    equal(getPort(), process.env.PORT || 9090)
  })

  it('Should return the default 9090', () => {
    equal(getPort({}), 9090)
  })

  it('Should return from the env', () => {
    equal(getPort({ PORT: '1234' }), 1234)
  })
})
