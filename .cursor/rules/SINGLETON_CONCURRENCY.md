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

1. The service is a singleton (`@Injectable({ lifetime: 'singleton' })`)
2. The creation step is async (involves I/O, spawning processes, network calls)
3. The resource is expensive or has side effects (ffmpeg process, file creation, external connection)
4. Multiple concurrent HTTP requests may trigger creation for the same key

## Fire-and-Forget Async Initialization

> See also [ASYNC_PATTERNS.mdc](./ASYNC_PATTERNS.mdc) for the broader rule on fire-and-forget promises and `fs/promises` usage.

Singleton services that need async initialization (e.g., loading config from a database, connecting to external APIs) should **not** block startup. Use a synchronous `init()` that kicks off the async work and logs errors.

### The Problem

```typescript
// ❌ Blocks startup — if configDataSet.get() hangs or is slow, the entire
// application startup stalls waiting for this single service.
@Injectable({ lifetime: 'singleton' })
export class MyService {
  public async init() {
    this.config = await this.configDataSet.get(this.systemInjector, 'MY_CONFIG')
    // ... subscribe to changes ...
  }
}

// Caller must await:
await injector.getInstance(MyService).init()
```

### The Fix: Synchronous `init()` with Error Logging

```typescript
// ✅ Non-blocking — startup continues, errors are logged not swallowed
@Injectable({ lifetime: 'singleton' })
export class MyService {
  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize MyService', data: { error } })
    })
  }

  private async initAsync() {
    this.config = await this.configDataSet.get(this.systemInjector, 'MY_CONFIG')
    // ... subscribe to changes ...
  }
}

// Caller does not need to await:
injector.getInstance(MyService).init()
```

### When to Apply

Use fire-and-forget init when:

1. The service depends on external data (database, API, file system) during initialization
2. The service can operate in a degraded state until initialization completes
3. Blocking startup would prevent other independent services from starting
4. The initialization failure should be logged, not crash the application

**Keep `async init()` when:**

- The service **must** be fully initialized before any caller uses it (e.g., schema migrations)
- The caller needs to know whether initialization succeeded before proceeding

## Dispose-Before-Reinit Guard

When a singleton service's `init()` method may be called more than once (e.g., triggered by config change events), dispose existing subscriptions before creating new ones. Without this guard, each call to `init()` creates duplicate event handlers while the old ones keep firing.

### The Problem

```typescript
// ❌ Each init() call leaks old subscriptions — handlers accumulate
@Injectable({ lifetime: 'singleton' })
export class MyService {
  declare private subscription: Disposable

  private async initAsync() {
    this.config = await this.configDataSet.get(...)
    // Old subscription is overwritten but never disposed!
    this.subscription = this.eventHub.subscribe('event', (e) => this.handle(e))
  }
}

// Caller re-initializes on config update — duplicate handlers
configDataSet.subscribe('onEntityUpdated', () => {
  injector.getInstance(MyService).init()
})
```

### The Fix: Dispose Old Subscriptions First

```typescript
// ✅ Old subscriptions are disposed before re-subscribing
@Injectable({ lifetime: 'singleton' })
export class MyService {
  declare private subscription: Disposable

  private async initAsync() {
    this.subscription?.[Symbol.dispose]()

    this.config = await this.configDataSet.get(...)
    this.subscription = this.eventHub.subscribe('event', (e) => this.handle(e))
  }
}
```

For multiple subscriptions, use an array pattern:

```typescript
// ✅ Batch dispose for multiple subscriptions
private configSubscriptions: Disposable[] = []

private async initAsync() {
  for (const sub of this.configSubscriptions) {
    sub[Symbol.dispose]()
  }
  this.configSubscriptions = []

  this.configSubscriptions.push(
    this.dataSet.subscribe('onEntityAdded', ...),
    this.dataSet.subscribe('onEntityUpdated', ...),
    this.dataSet.subscribe('onEntityRemoved', ...),
  )
}
```

### When to Apply

Apply this pattern when **any** of the following are true:

1. The service subscribes to events or datasets during `init()`
2. `init()` can be called more than once (e.g., from config change listeners)
3. The service is re-initialized without being fully disposed first

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
