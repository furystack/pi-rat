import { getPort } from './get-port.js'
import { describe, expect, it } from 'vitest'

describe('getPort', () => {
  it('Should return the default 9090 from env', () => {
    expect(getPort()).toBe(process.env.PORT || 9090)
  })

  it('Should return the default 9090', () => {
    expect(getPort({})).toBe(9090)
  })

  it('Should return from the env', () => {
    expect(getPort({ PORT: '1234' })).toBe(1234)
  })
})
