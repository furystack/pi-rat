---
name: setup-data-layer
description: Wire a new entity into the data layer — model, store binding, DataSet with authorization/hooks, optional entity sync. Use when the user asks to add an entity, persist a model, expose a collection, or set up a new DataSet.
---

# setup-data-layer

Add an entity end-to-end through the FuryStack data stack: model → physical store → throw-by-default token wiring → DataSet with auth/hooks → entity sync. Read `.cursor/rules/BACKEND_PATTERNS.mdc`, `.cursor/rules/CACHE_HANDLING.mdc`, and `.cursor/rules/CODE_STYLE.mdc` before authoring; this skill owns the workflow.

> **Pi-rat layout note:** pi-rat splits stores by module — define stores and DataSets in `service/src/app-models/<module>/setup-<module>-store.ts`. The skill's generic `service/src/setup-store.ts` reference should be translated to the per-module path. Pi-rat persistent stores typically use `defineSequelizeStore` (sqlite-backed); see existing `setup-identity-store.ts` for the canonical pattern.

## Step 1 — Define the model

Create the entity class in `common/src/models/<entity>.ts`. Use `declare` for fields so TS doesn't emit them as initialized properties (compatibility with FileSystem / DB stores):

```typescript
export class User {
  declare username: string
  declare displayName: string
  declare roles: string[]
}
```

Re-export from `common/src/models/index.ts` and `common/src/index.ts`.

## Step 2 — Pick a backend

| Backend                 | Use case                                | Helper                                        |
| ----------------------- | --------------------------------------- | --------------------------------------------- |
| `InMemoryStore`         | Tests, ephemeral data, sessions         | `defineStore` + `new InMemoryStore({...})`    |
| `defineFileSystemStore` | Local persistence (small datasets, dev) | one-liner                                     |
| `defineMongoDbStore`    | Document data, larger scale             | one-liner with `client`, `db`, `collection`   |
| `defineSequelizeStore`  | Relational                              | one-liner with `sequelizeModel`, `initModel?` |
| `defineRedisStore`      | Cache-shaped persistence                | one-liner with `client`                       |

If the backend needs to be authored from scratch, run the `implement-store-adapter` skill first (or read `LIBRARY_DEVELOPMENT.mdc` Stores section).

## Step 3 — Define the physical store

Add to `service/src/setup-store.ts` (or a per-module setup file):

```typescript
import { defineFileSystemStore } from '@furystack/filesystem-store'
import { join } from 'path'
import { User } from 'common'

const UsersFileStore = defineFileSystemStore({
  name: 'app/UsersFileStore',
  model: User,
  primaryKey: 'username',
  fileName: join(process.cwd(), 'users.json'),
  tickMs: 30_000,
})
```

If TypeScript widens `TPrimaryKey` to `keyof T`, pass explicit generics: `defineFileSystemStore<User, 'username'>({ ... })`.

## Step 4 — Bind to framework throw-by-default tokens (if applicable)

Some FuryStack-shipped tokens (`UserStore`, `SessionStore`, `PasswordCredentialStore`, etc.) default to factories that throw `NotConfiguredError`. Bind your concrete store:

```typescript
import { UserStore } from '@furystack/rest-service'

export const setupStore = (injector: Injector): void => {
  injector.bind(UserStore, ({ inject }) => inject(UsersFileStore))
  // ...
}
```

For app-defined entities with no framework token, skip this step — the `defineXxxStore` token is already singleton-cached.

## Step 5 — Define the DataSet

DataSets are the **write gateway**. Add to `service/src/setup-store.ts` or a per-module file:

```typescript
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { authorizedDataSet } from './authorization/authorized-only.js'

export const UserDataSet: DataSetToken<User, 'username'> = defineDataSet({
  name: 'app/UserDataSet',
  store: UserStore, // can be a framework token or a local store token
  settings: {
    ...authorizedDataSet, // role checks
    onEntityAdded: ({ injector, entity }) => {
      /* side effects */
    },
    authorizeUpdate: async ({ entity, injector }) => ({
      isAllowed: entity.username !== 'system',
      message: 'Cannot update the system user',
    }),
  },
})
```

- `authorizeAdd` / `authorizeGet` / `authorizeRemove` / `authorizeUpdate` for role-based gates
- `onEntityAdded` / `onEntityUpdated` / `onEntityRemoved` for side effects (audit log, notifications)
- Annotate the type explicitly (`DataSetToken<T, PK>`) — inline callbacks can widen `TPrimaryKey` to `keyof T`

## Step 6 — Application code consumes the DataSet token

Application code resolves the **DataSet token**, never the store token directly:

```typescript
import { getDataSetFor } from '@furystack/repository'

const userDataSet = getDataSetFor(injector, UserDataSet)
await userDataSet.add(injector, { username: 'alice', displayName: 'Alice', roles: [] })
```

The `furystack/no-direct-store-token` lint rule enforces this. Direct store access is allowed only inside DataSet factories, store implementations testing themselves, and test data seeding.

For server-internal operations (system user, scheduled jobs) wrap in `useSystemIdentityContext`:

```typescript
import { useSystemIdentityContext } from '@furystack/core'
import { usingAsync } from '@furystack/utils'

await usingAsync(useSystemIdentityContext({ injector, username: 'Seeder' }), async (sys) => {
  const ds = getDataSetFor(sys, UserDataSet)
  await ds.add(sys, seedUser)
})
```

## Step 7 — Entity sync (optional)

If frontend caches need to invalidate when the entity changes, opt-in via `useEntitySync`:

```typescript
import { useEntitySync } from '@furystack/rest-service'

useEntitySync(injector, { models: [UserDataSet, OrderDataSet] })
```

This emits change events the frontend can subscribe to. Each model passed in must be a `DataSetToken`, not a raw store token.

## Step 8 — REST endpoints (if exposed)

If users need to read/write this entity over HTTP, run the `create-api-endpoint` skill — pick the **DataSet-backed CRUD** branch and use `createGetCollectionEndpoint(UserDataSet)` etc.

## Step 9 — Seed (optional)

For initial data, add to `service/src/seed.ts` (or `service/src/bin/seed-<entity>.ts`):

```typescript
await usingAsync(useSystemIdentityContext({ injector, username: 'Seeder' }), async (sys) => {
  const ds = getDataSetFor(sys, UserDataSet)
  if ((await ds.count(sys, {})) === 0) {
    await ds.add(sys, { username: 'admin', displayName: 'Admin', roles: ['admin'] })
  }
})
```

Run with `yarn seed`.

## Step 10 — Tests

Run `write-tests` skill. Cover:

- **DataSet auth** — `add` / `update` / `remove` blocked when authorize callback returns `isAllowed: false`
- **Hooks** — `onEntityAdded` etc. fire with correct payloads
- **Type integrity** — primary key generic doesn't widen
- **Disposal** — `injector[Symbol.asyncDispose]()` cleans up the store

Wrap every `Injector` and store usage in `usingAsync` per `TESTING_GUIDELINES.mdc`.

## Step 11 — Verify

```bash
yarn lint
yarn build
yarn test
```

If `furystack/no-direct-store-token` fires, the test or app code resolved the wrong token.

## Output

Report:

- Model file + exports
- Physical store factory
- DataSet token + auth/hooks
- Framework token bindings, if any
- Entity sync registration, if any
- Endpoints generated, if any (link to `create-api-endpoint` invocation)
- Seeded counts, if any
