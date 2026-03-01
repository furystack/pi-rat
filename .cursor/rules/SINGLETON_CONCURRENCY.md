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
