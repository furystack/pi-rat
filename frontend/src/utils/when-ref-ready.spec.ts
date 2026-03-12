import type { RefObject } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { whenRefReady } from './when-ref-ready.js'

describe('whenRefReady', () => {
  let rAFCallbacks: FrameRequestCallback[]
  let nextFrameId: number

  beforeEach(() => {
    rAFCallbacks = []
    nextFrameId = 1
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rAFCallbacks.push(cb)
      return nextFrameId++
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call callback immediately when ref.current is set', () => {
    const callback = vi.fn()
    const ref = { current: document.createElement('div') } as RefObject<HTMLElement>

    whenRefReady(ref, callback)

    expect(callback).toHaveBeenCalledWith(ref.current)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('should defer callback via rAF when ref.current is null', () => {
    const callback = vi.fn()
    const ref = { current: null } as unknown as RefObject<HTMLElement>

    whenRefReady(ref, callback)

    expect(callback).not.toHaveBeenCalled()
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
  })

  it('should call callback after rAF fires when ref becomes ready', () => {
    const element = document.createElement('div')
    const callback = vi.fn()
    const ref: { current: HTMLElement | null } = { current: null }

    whenRefReady(ref as unknown as RefObject<HTMLElement>, callback)

    ref.current = element
    rAFCallbacks[0](0)

    expect(callback).toHaveBeenCalledWith(element)
  })

  it('should return cleanup from callback when ref is ready', () => {
    const disposeFn = vi.fn()
    const ref = { current: document.createElement('div') } as RefObject<HTMLElement>

    const result = whenRefReady(ref, () => ({ [Symbol.dispose]: disposeFn }))
    result[Symbol.dispose]()

    expect(disposeFn).toHaveBeenCalledOnce()
  })

  it('should return a no-op disposable when callback returns void', () => {
    const ref = { current: document.createElement('div') } as RefObject<HTMLElement>

    const result = whenRefReady(ref, () => {})

    expect(() => result[Symbol.dispose]()).not.toThrow()
  })

  it('should cancel rAF on dispose when ref was not ready', () => {
    const ref = { current: null } as unknown as RefObject<HTMLElement>

    const result = whenRefReady(ref, vi.fn())
    result[Symbol.dispose]()

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it('should dispose deferred cleanup when rAF fired', () => {
    const disposeFn = vi.fn()
    const element = document.createElement('div')
    const ref: { current: HTMLElement | null } = { current: null }

    const result = whenRefReady(ref as unknown as RefObject<HTMLElement>, () => ({
      [Symbol.dispose]: disposeFn,
    }))

    ref.current = element
    rAFCallbacks[0](0)

    result[Symbol.dispose]()
    expect(disposeFn).toHaveBeenCalledOnce()
  })

  it('should not call callback if disposed before rAF fires', () => {
    const callback = vi.fn()
    const ref = { current: null } as unknown as RefObject<HTMLElement>

    const result = whenRefReady(ref, callback)
    result[Symbol.dispose]()

    expect(callback).not.toHaveBeenCalled()
  })
})
