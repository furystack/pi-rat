<!-- version-type: patch -->

# frontend

## ✨ Features

### Dedicated `AppEntitySync` service

Extracted the entity-sync wiring from `frontend/src/index.tsx` into a reusable
`AppEntitySync` service registered on the injector. The bootstrap code now
resolves the sync service through DI instead of constructing it manually:

```typescript
// Before
const syncService = new EntitySyncService({
  wsUrl: syncWsUrl,
  localStore: createInMemoryCacheStore(),
})
shadeInjector.setExplicitInstance(syncService)

// After
const syncService = shadeInjector.get(AppEntitySync)
```

## ♻️ Refactoring

### Adopted the new `@furystack/inject` v13 API

All frontend services and components were migrated to the new injector API:

- `new Injector()` is now `createInjector()` in the bootstrap.
- `injector.getInstance(X)` was replaced with `injector.get(X)` (and
  `injector.getAsync(X)` where async resolution is required).
- `injector.setExplicitInstance(value, Token)` was replaced with
  `injector.bind(Token, () => value)` (used for the `IdentityContext` binding
  to `SessionService`).
- `@Injectable` singletons (chat, AI, file-browser, IoT, media, session,
  speech, websocket-events, watch-progress, theme cheats, etc.) were updated
  to the new decorator/registration semantics.

### REST client and entity-sync API alignment

Service classes that talk to the backend (chat, AI chat, AI models, users,
movies/series, drives, dashboards, IoT, logging, OMDb/TMDb, watch progress,
session, install) were updated to match the new
`@furystack/rest-client-fetch@9` and `@furystack/entity-sync-client@3` APIs.

## 🧪 Tests

- Updated unit and component tests (`dashboard`, `theme-switch`, `wizard-step`,
  `generic-error`, `media-overview-layout`, admin pages, services and util
  helpers) to use `injector.get`/`getAsync` and the new injector bootstrap.

## ⬆️ Dependencies

- Bumped `@furystack/cache` to `^7.0.0`
- Bumped `@furystack/core` to `^17.0.0`
- Bumped `@furystack/entity-sync` to `^2.0.0`
- Bumped `@furystack/entity-sync-client` to `^3.0.0`
- Bumped `@furystack/inject` to `^13.0.0`
- Bumped `@furystack/logging` to `^9.0.0`
- Bumped `@furystack/rest` to `^10.0.0` (devDependency)
- Bumped `@furystack/rest-client-fetch` to `^9.0.0`
- Bumped `@furystack/shades` to `^15.0.0`
- Bumped `@furystack/shades-common-components` to `^17.0.0`
- Bumped `@furystack/shades-lottie` to `^11.0.0`
- Bumped `@furystack/shades-mfe` to `^5.0.0`
- Bumped `@furystack/utils` to `^9.0.0`
