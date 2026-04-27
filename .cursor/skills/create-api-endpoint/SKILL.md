---
name: create-api-endpoint
description: Add a REST endpoint to the app — type contract in common, validation schema, action implementation, registration, tests, changelog. Use when the user asks to add/expose/create a new endpoint, route, REST API, or wants to convert a function into an HTTP-callable action. Branches between custom actions and DataSet-backed CRUD.
---

# create-api-endpoint

Add a REST endpoint end-to-end. Touches `common/`, `service/`, possibly `frontend/` (api client). Read `.cursor/rules/BACKEND_PATTERNS.mdc`, `.cursor/rules/REST_ACTION_VALIDATION.mdc`, `.cursor/rules/ERROR_HANDLING.mdc`, and `.cursor/rules/CODE_STYLE.mdc` before authoring; this skill owns the workflow.

> **Pi-rat layout note:** pi-rat splits APIs by module — type contracts live in `common/src/apis/<module>.ts`, endpoints register in `service/src/app-models/<module>/setup-<module>-rest-api.ts`, and individual actions go in `service/src/app-models/<module>/actions/<verb>-<entity>-action.ts`. The skill's generic step references (`common/src/<api-name>.ts`, `service/src/setup-rest-api.ts`) should be translated to those paths.

## Step 0 — Decide branch

| Branch                  | When                                                          |
| ----------------------- | ------------------------------------------------------------- |
| **Custom action**       | Bespoke logic, projection, search, command-style endpoint     |
| **DataSet-backed CRUD** | Standard create / list / get / update / delete over an entity |

If unsure, ask the user. The branches share Steps 1–3 then diverge.

## Step 1 — Define the type contract (`common/`)

Add to `common/src/<api-name>.ts` (or extend the existing API interface):

```typescript
export type <Name>Endpoint = {
  url?: { /* path params */ }
  query?: { /* query params */ }
  body?: { /* request body */ }
  result: /* response shape */
}

// Plug into the API interface:
export interface BoilerplateApi extends RestApi {
  GET: { /* ... */ '/my/path': MyEndpoint }
  POST: { /* ... */ }
}
```

Match the HTTP method semantics: `GET` for safe/idempotent reads, `POST` for create/command, `PUT`/`PATCH` for updates, `DELETE` for removal.

Re-export from `common/src/index.ts` if needed.

## Step 2 — Regenerate JSON schemas

```bash
yarn create-schemas
```

This refreshes `common/schemas/*.json`. Verify the new endpoint type appears as a schema definition. If it doesn't, the type isn't reachable from the API interface — fix the export.

## Step 3 — Decide validation + auth

| Wrapper                                                            | Purpose                                                             | Layering     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------ |
| `Validate({ schema, schemaName })(...)`                            | JSON-schema-validate `query`, `url`, `body` before the handler runs | innermost    |
| `Authenticate()(...)`                                              | reject unauthenticated requests                                     | outer        |
| Built-in framework action (`GetCurrentUser`, `LogoutAction`, etc.) | no wrapper needed; built-in handles its own validation/auth         | use directly |

The `furystack/rest-action-validate-wrapper` lint rule requires `Validate(...)` for any custom action that consumes `query`, `url`, or `body`. Skipping it requires an `eslint-disable` comment with a justification.

## Step 4a — Custom action

```typescript
import { JsonResult, Validate, Authenticate } from '@furystack/rest-service'
import { RequestError } from '@furystack/rest-service'

// In service/src/setup-rest-api.ts (or a per-module setup-<x>-rest-api.ts):
GET: {
  '/users/:id/avatar': Authenticate()(
    Validate({ schema: BoilerplateApiSchemas, schemaName: 'GetAvatarEndpoint' })(
      async (options) => {
        const { id } = options.getUrlParams()
        const user = await loadUser(id)
        if (!user) throw new RequestError('User not found', 404)
        return JsonResult({ url: user.avatarUrl })
      },
    ),
  ),
}
```

- Throw `RequestError(message, code)` for HTTP errors. Codes: 400 validation, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 500 server.
- **Do not** throw plain `Error` — `furystack/rest-action-use-request-error` lint rule forbids it.
- For non-trivial logic, extract a pure helper (`load-user.ts`, `format-user-payload.ts`) — keeps the action <40 lines per `COMPLEXITY.mdc`.

## Step 4b — DataSet-backed CRUD

If the endpoint is standard CRUD over an entity:

1. Run `setup-data-layer` skill if the DataSet doesn't exist yet.
2. Use the endpoint generators from `@furystack/rest-service` / `@furystack/repository`:

   ```typescript
   import {
     createGetCollectionEndpoint,
     createGetEntityEndpoint,
     createPostEntityEndpoint,
     createPatchEntityEndpoint,
     createDeleteEntityEndpoint,
   } from '@furystack/rest-service'

   GET: {
     '/users': createGetCollectionEndpoint(UserDataSet),
     '/users/:id': createGetEntityEndpoint(UserDataSet),
   },
   POST: { '/users': createPostEntityEndpoint(UserDataSet) },
   PATCH: { '/users/:id': createPatchEntityEndpoint(UserDataSet) },
   DELETE: { '/users/:id': createDeleteEntityEndpoint(UserDataSet) },
   ```

3. Authorization, hooks, and entity sync are handled by the DataSet — don't reimplement them in the endpoint.

## Step 5 — Register

Add the endpoint to `service/src/setup-rest-api.ts` under the right HTTP method block. Keep the file sorted by path within each method.

For larger APIs (pi-rat), endpoints split by module in `service/src/app-models/<module>/setup-<module>-rest-api.ts` — follow the existing pattern.

## Step 6 — Frontend client (if exposed to the UI)

If the frontend should call this endpoint, the typed `BoilerplateApiClient` (from `frontend/src/services/`) auto-derives the call signature from the `BoilerplateApi` type. No manual client code needed:

```typescript
const apiClient = injector.get(BoilerplateApiClient)
const { result } = await apiClient.call({
  method: 'GET',
  action: '/users/:id/avatar',
  url: { id },
})
```

## Step 7 — Tests

Run the `write-tests` skill. Cover:

- **Action unit test** — happy path, missing params, validation failures, auth rejection, `RequestError` codes
- **E2E** for user-visible flows — Playwright drives the full stack via `yarn test:e2e`

## Step 8 — Changelog

Run the `fill-changelog` skill or manually add to `.yarn/changelogs/`:

- ✨ Features for new endpoints
- 💥 Breaking Changes if existing endpoint surface changed (rename, removal, param change)

## Step 9 — Verify

```bash
yarn lint
yarn build
yarn test
```

If any `eslint-disable` comments were added, ensure each has a justification.

## Output

Report:

- Type contract changes (file + new symbols)
- Schema regen status
- Endpoint(s) added with method + path
- Auth/validation wrappers applied
- Tests added
- Changelog entry filled
