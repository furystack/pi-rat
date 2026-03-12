import type { RefObject } from '@furystack/shades'

/**
 * Calls `callback` with the ref's current element. If the element is not
 * yet available (ref.current is null during the first render pass), defers
 * the call to the next animation frame.
 *
 * Returns a Disposable that cancels any deferred call and invokes the
 * cleanup disposable returned by `callback` (if any).
 */
export const whenRefReady = <T extends Element>(
  ref: RefObject<T>,
  callback: (element: T) => Disposable | void,
): Disposable => {
  const el = ref.current
  if (el) {
    const cleanup = callback(el)
    return cleanup ?? { [Symbol.dispose]: () => {} }
  }

  let cleanup: Disposable | null = null
  const frameId = requestAnimationFrame(() => {
    const deferred = ref.current
    if (deferred) {
      cleanup = callback(deferred) ?? null
    }
  })
  return {
    [Symbol.dispose]: () => {
      cancelAnimationFrame(frameId)
      cleanup?.[Symbol.dispose]()
    },
  }
}
