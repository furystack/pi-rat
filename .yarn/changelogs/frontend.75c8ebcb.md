<!-- version-type: patch -->

# frontend

## ♻️ Refactoring

### Strongly-typed nested routing

Replaced the hand-rolled `AppLink` / `AppBarAppLink` double-cast wrappers in `routes/index.ts` with the upstream type-safe factories exposed by `@furystack/shades` 14 and `@furystack/shades-common-components` 16:

- Route tree is now declared through `defineNestedRoutes(...)` so per-route literal types (including future `query` / `hash` schemas) are preserved.
- `AppLink = createNestedRouteLink<typeof appRoutes & typeof authRoutes>()`
- `AppBarAppLink = createAppBarLink<typeof appRoutes & typeof authRoutes>()`
- `AppPaths` is now re-exported via the upstream `ExtractRoutePaths` helper instead of the locally duplicated type.

All `<AppLink href="..." />`, `<AppBarAppLink href="..." />` and `<NestedRouteLink href="..." />` call sites were renamed to use the new `path` prop that v14 introduced.

## ⬆️ Dependencies

- Updated `@furystack/shades` to `^14.0.0` (major — `href` → `path` prop on `NestedRouteLink`; removed legacy flat router exports)
- Updated `@furystack/shades-common-components` to `^16.0.0` (major — `AppBarLink` uses `path`; removed `Grid` / `Autocomplete` / row-click options)
- Updated `@furystack/shades-lottie` to `^10.0.0` (major)
- Updated `@furystack/shades-mfe` to `^4.0.0` (major)
- Updated `@furystack/rest` to `^9.0.0` (major) and `@furystack/rest-client-fetch` to `^8.1.8`
- Updated `@furystack/cache` to `^6.1.5`, `@furystack/core` to `^16.0.4`, `@furystack/entity-sync` to `^1.0.11`, `@furystack/entity-sync-client` to `^2.0.5`, `@furystack/inject` to `^12.0.36`, `@furystack/logging` to `^8.1.5`, `@furystack/utils` to `^8.2.5`
- Updated `@codecov/vite-plugin` to `^2.0.1` (major)
- Updated `hls.js` to `^1.6.16`, `path-to-regexp` to `^8.4.2`
- Updated dev `typescript` to `^6.0.3`, `vite` to `^8.0.10`, `@types/node` to `^25.6.0`
