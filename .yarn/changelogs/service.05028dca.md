<!-- version-type: patch -->

# service

## ♻️ Refactoring

### Adopted the new `@furystack/inject` v13 API

Replaced the legacy `Injector` class instantiation and decorator-based DI usage
with the new functional API:

- `new Injector()` is now `createInjector()` (see `service/src/root-injector.ts`).
- `injector.getInstance(X)` calls were migrated to `injector.get(X)` for
  synchronous resolution and `injector.getAsync(X)` for services that need
  asynchronous initialization.
- `injector.createChild(...)` was replaced by `injector.createScope(...)`.
- `injector.setExplicitInstance(...)` was replaced by `injector.bind(Token, factory)`.
- Several `@Injectable` singletons were converted into plain functions or
  factory-bound services where the class wrapper no longer added value
  (e.g. `service-installer`, `setup-patcher`, `shutdown-handler`,
  `impersonated-identity-context`, `external-service-status-registry`,
  `ffprobe-service`, `hw-accel-detector`, `movie-file-maintainer`,
  `db-logger`, `device-availability-hub`, `file-watcher-service`).

### Replaced `PiRatRootService` with a `startPiRat` entry point

The root service class was removed in favour of a top-level async function:

```typescript
// Before
rootInjector.getInstance(PiRatRootService)

// After
await startPiRat(rootInjector)
```

`AppModelManager.registerInternalAppModels` now accepts the injector together
with the app-model classes (instead of pre-resolved instances), so app models
are constructed lazily by the manager.

### Migrated to `useWebSocketApi`

`useWebsockets` from `@furystack/websocket-api` was renamed and now takes a
single options object:

```typescript
// Before
await useWebsockets(injector, { port, path, actions })

// After
await useWebSocketApi({ injector, port, path, actions })
```

The same change was applied to the entity-sync websocket setup and the
`WebsocketService` announcement plumbing.

## 🧪 Tests

- Updated REST action and service unit tests across `app-models/**` to use the
  new `injector.get`/`injector.getAsync` resolution and to reflect the new
  app-model registration signature.
- Refreshed mocks and fixtures for `transcoding-session`, `hw-accel-detector`,
  `movie-file-maintainer`, `external-service-status-registry`, `ffprobe-service`
  and the various `ensure-*-exists` utilities to match the new APIs.

## ⬆️ Dependencies

- Bumped `@furystack/cache` to `^7.0.0`
- Bumped `@furystack/core` to `^17.0.0`
- Bumped `@furystack/entity-sync` to `^2.0.0`
- Bumped `@furystack/entity-sync-service` to `^2.0.0`
- Bumped `@furystack/inject` to `^13.0.0`
- Bumped `@furystack/logging` to `^9.0.0`
- Bumped `@furystack/repository` to `^11.0.0`
- Bumped `@furystack/rest` to `^10.0.0`
- Bumped `@furystack/rest-service` to `^14.0.0`
- Bumped `@furystack/security` to `^8.0.0`
- Bumped `@furystack/sequelize-store` to `^7.0.0`
- Bumped `@furystack/utils` to `^9.0.0`
- Bumped `@furystack/websocket-api` to `^14.0.0`
