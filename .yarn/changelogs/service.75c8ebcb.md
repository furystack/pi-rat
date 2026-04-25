<!-- version-type: patch -->

# service

## ♻️ Refactoring

### Migrated the identity `/login` endpoint to `createPasswordLoginAction`

`@furystack/rest-service` 13 removed the legacy static `LoginAction`. `setupIdentityRestApi` now wires `/login` through the factory-based API that captures the auth services once at setup time:

```ts
'/login': Validate({ schema: identityApiSchema, schemaName: 'LoginAction' })(
  createPasswordLoginAction(createCookieLoginStrategy(injector)) as RequestAction<PiRatLoginAction>,
)
```

## 🐛 Bug Fixes

- `execFileAsync` and the drives `UploadAction` now always reject their promises with `Error` instances (`err instanceof Error ? err : new Error(JSON.stringify(err))`) so callers observing the rejection reason can rely on a real `Error` stack, and to satisfy `@typescript-eslint/prefer-promise-reject-errors`.

## ⬆️ Dependencies

- Updated `@furystack/rest-service` to `^13.0.0` (major — removed legacy `LoginAction` and Swagger-named aliases)
- Updated `@furystack/rest` to `^9.0.0` (major)
- Updated `@furystack/cache` to `^6.1.5`, `@furystack/core` to `^16.0.4`, `@furystack/entity-sync` to `^1.0.11`, `@furystack/entity-sync-service` to `^1.0.13`, `@furystack/inject` to `^12.0.36`, `@furystack/logging` to `^8.1.5`, `@furystack/repository` to `^10.1.11`, `@furystack/security` to `^7.0.9`, `@furystack/sequelize-store` to `^6.0.49`, `@furystack/utils` to `^8.2.5`, `@furystack/websocket-api` to `^13.2.8`
- Updated dev `@types/formidable` to `^3.5.1`, `@types/node` to `^25.6.0`, `typescript` to `^6.0.3`, and `vitest` to `^4.1.5`
