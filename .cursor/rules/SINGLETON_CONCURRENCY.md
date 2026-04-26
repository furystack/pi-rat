# Singleton Concurrency Patterns

## Protect `getOrCreate` Methods Against Concurrent Callers

Singleton services that manage shared resources (e.g., ffmpeg processes, database connections, cache entries) with async initialization are vulnerable to race conditions when multiple concurrent requests hit `getOrCreate`-style methods.

### The Problem

```typescript
// ❌ Race condition — two concurrent callers both see `existing` as undefined
public async getOrCreateSession(key: string): Promise<Session> {
  const existing = this.sessions.get(key)
  if (existing) return existing

  // Both callers reach here before either sets the map
  const session = await this.createExpensiveResource(key)
  this.sessions.set(key, session)
  return session
}
```

### The Fix: Pending-Promise Map

Use a secondary `Map` to track in-flight creation promises:

```typescript
// ✅ Safe — second caller awaits the first caller's promise
private pendingSessions = new Map<string, Promise<Session>>()

public async getOrCreateSession(key: string): Promise<Session> {
  const existing = this.sessions.get(key)
  if (existing) return existing

  const pending = this.pendingSessions.get(key)
  if (pending) return pending

  const createPromise = this.createExpensiveResource(key)
  this.pendingSessions.set(key, createPromise)

  try {
    return await createPromise
  } finally {
    this.pendingSessions.delete(key)
  }
}
```

### When to Apply

Apply this pattern when **all** of the following are true:

1. The service is a singleton (`defineService({ lifetime: 'singleton' })`)
2. The creation step is async (involves I/O, spawning processes, network calls)
3. The resource is expensive or has side effects (ffmpeg process, file creation, external connection)
4. Multiple concurrent HTTP requests may trigger creation for the same key

## Inline Initialization in `defineService` Factories

> See also [ASYNC_PATTERNS.mdc](./ASYNC_PATTERNS.mdc) for the broader rule on fire-and-forget promises and `fs/promises` usage.

Singleton services run their setup logic inside the `defineService` factory body. The factory creates internal state, registers event listeners, kicks off async work, and returns the service interface. There is no separate public `init()` method to call from setup helpers.

### The Pattern

```typescript
// ✅ Init logic is inline; the factory returns a fully-wired service
export const MyService: Token<MyService, 'singleton'> = defineService({
  name: 'pi-rat/MyService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)

    let config: MyConfig | undefined

    const service: MyService = {
      // ... methods that close over `config`, `logger`, ... ...
    }

    // Sync setup runs inline.
    socket.addListener('onMessage', onMessage)

    // Async work that should not block startup is fire-and-forget here.
    const configWatcher = createConfigWatcher<MyConfig>({
      /* ... */ onChange: (next) => {
        config = next
      },
    })
    void configWatcher.init().catch((error) => {
      void logger.error({ message: 'Failed to initialize MyService', data: { error } })
    })

    onDispose(() => configWatcher.dispose())
    onDispose(() => socket.removeListener('onMessage', onMessage))

    return service
  },
})
```

### Rules

- **Do not expose a public `init()` method on the service interface.** Initialization is the factory's responsibility.
- **Sync init logic is inlined** in the factory body before `return`.
- **Async init logic that can finish quickly and must complete before usage** uses `defineServiceAsync` and is `await`ed inline. Consumers must use `injector.getAsync(...)`.
- **Async init logic that should not block startup** (config loading from external sources, ping loops, etc.) is launched fire-and-forget inline with a `.catch` that logs the error. The factory stays sync (`defineService`).
- **Setup helpers (`useFooBar(injector)`, `setupBaz(injector)`)** trigger initialization by calling `injector.get(MyService)` or `await injector.getAsync(MyService)`. They no longer call `service.init()`.

### Fire-and-Forget Async Setup

```typescript
// ❌ Blocks startup — if configDataSet.get() hangs, the entire app stalls.
factory: async (ctx) => {
  const config = await configDataSet.get(systemInjector, 'MY_CONFIG')
  // ...
}

// ✅ Non-blocking — startup continues, errors are logged not swallowed.
factory: (ctx) => {
  // ...
  void configWatcher.init().catch((error) => {
    void logger.error({ message: 'Failed to initialize MyService', data: { error } })
  })
  // ...
}
```

Use fire-and-forget init when **all** of the following are true:

1. The service depends on external data (database, API, file system) during initialization.
2. The service can operate in a degraded state until initialization completes.
3. Blocking startup would prevent other independent services from starting.
4. The initialization failure should be logged, not crash the application.

Use `defineServiceAsync` only when:

- The service **must** be fully initialized before any caller uses it (e.g., schema migrations).
- The caller needs to know whether initialization succeeded before proceeding.

## Dispose Subscriptions on Service Teardown

The factory pattern guarantees init runs once per singleton, so the historical "dispose-before-reinit" guard is no longer needed. However, every subscription created inside the factory must still be torn down via `onDispose`.

```typescript
// ✅ All subscriptions are disposed when the injector tears down the service.
factory: (ctx) => {
  const { onDispose } = ctx

  const subscriptions: Disposable[] = []
  subscriptions.push(
    dataSet.subscribe('onEntityAdded' /* ... */),
    dataSet.subscribe('onEntityUpdated' /* ... */),
    dataSet.subscribe('onEntityRemoved' /* ... */),
  )

  onDispose(() => {
    for (const sub of subscriptions) sub[Symbol.dispose]()
  })

  return service
}
```

### When to Apply

Apply this pattern when **any** of the following are true:

1. The service subscribes to events or datasets during the factory body.
2. The service holds external resources that must be released (file watchers, sockets, timers).

### Don't Mutate Collections While Iterating

When cleaning up entries from a `Map` or `Set` during iteration, collect keys first and delete in a separate pass:

```typescript
// ❌ Fragile — mutating Map during iteration
for (const [key, session] of this.sessions) {
  if (isExpired(session)) {
    this.sessions.delete(key) // Mutation during iteration
  }
}

// ✅ Safe — collect then delete
const keysToRemove: string[] = []
for (const [key, session] of this.sessions) {
  if (isExpired(session)) {
    keysToRemove.push(key)
  }
}
for (const key of keysToRemove) {
  this.sessions.delete(key)
}
```
