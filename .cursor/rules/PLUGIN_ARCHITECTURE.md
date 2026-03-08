# Plugin Architecture

## Plugin Package Structure

Plugins live under `plugins/<name>/` with three sub-packages:

```
plugins/<name>/common/    -- @pi-rat/<name>-common  (models, API types, schemas)
plugins/<name>/service/   -- @pi-rat/<name>-service  (AppModel, store setup, REST setup)
plugins/<name>/frontend/  -- @pi-rat/<name>-frontend (routes, pages, services, widgets, commands)
```

## Extraction Checklist

When extracting a feature into a plugin:

1. **Move, don't copy** -- Delete the original files after moving them to the plugin. Never leave duplicated code in both locations.
2. **Update all import paths** -- Search the entire codebase for imports of moved types/modules and update them to the new `@pi-rat/<name>-*` package paths.
3. **Remove from `common` exports** -- Delete re-exports from `common/src/models/index.ts` and `common/src/apis/index.ts` for types that moved.
4. **Update schema generation** -- Remove moved entries from `common/src/bin/create-schemas.ts`. The plugin's own `create-schemas.ts` should reuse the shared `generateSchemas` from `common/bin/schema-utils`.
5. **Delete old schema files** -- Remove generated JSON schemas from `common/schemas/` for the moved types.
6. **Update tsconfig references** -- Add plugin packages to `tsconfig.json` references in consuming packages (`service/`, `frontend/`).
7. **Update ESLint ignores** -- Add `plugins/*/common/dist/*`, `plugins/*/service/dist/*`, `plugins/*/frontend/dist/*` to the ESLint config ignores.
8. **Update build script** -- Ensure the root `package.json` build script includes the new packages in the correct order (common before service/frontend).

## Dependency Direction

- Plugins depend on `common` (core types), never the reverse
- `common` must NOT import from any `@pi-rat/*` package (circular dependency)
- Plugin frontend packages depend on `@pi-rat/<name>-common` and `common`, NOT on the core `frontend` package
- Cross-plugin dependencies are one-directional (e.g., media depends on drives, not vice versa)

## Frontend Registries

Seven singleton registries exist in `frontend/src/services/registries/`:

| Registry                  | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `RouteRegistry`           | Top-level routes                        |
| `WidgetRegistry`          | Dashboard widget type -> renderer map   |
| `CommandProviderRegistry` | Command palette providers               |
| `SettingsRegistry`        | Settings sub-routes                     |
| `EntityRouteRegistry`     | Entity CRUD sub-routes                  |
| `FileContextMenuRegistry` | File browser context menu contributions |
| `FileAssociationRegistry` | File extension -> viewer mappings       |

### Registry Safety

- Key-based registries (`RouteRegistry`, `SettingsRegistry`, `EntityRouteRegistry`) log a warning on duplicate key registration.
- Always register through registries rather than hardcoding into static route/switch objects.

## Backend AppModel Pattern

Each plugin's service package exports an `InternalAppModel` implementation:

```typescript
@Injectable({ lifetime: 'singleton' })
export class FooAppModel implements InternalAppModel {
  manifest = FooManifest
  state: AppState = { type: 'initializing' }

  declare private injector: Injector

  private options: FooPluginOptions | undefined

  public configure(options: FooPluginOptions) {
    this.options = options
    return this
  }

  public async setup() {
    if (!this.options) {
      throw new Error('FooAppModel.configure() must be called before setup()')
    }
    await Promise.all([setupFooStore(this.injector, this.options), setupFooApi(this.injector, this.options)])
  }

  public getEntitySyncModels(): EntitySyncModelConfig[] {
    return [entitySyncConfig({ model: FooEntity, primaryKey: 'id' })]
  }
}
```

### configure() Options Pattern

Plugin AppModels cannot directly import core service internals (e.g., `getPort()`, `getCorsOptions()`, `WebsocketService`). Instead, the host passes these via `configure()`:

```typescript
// In service.ts (host)
const fooAppModel = injector.getInstance(FooAppModel).configure({
  port: getPort(),
  cors: getCorsOptions(),
  getDbSettings: getDefaultDbSettings,
  withRole,
  announce: (message, filter) =>
    injector.getInstance(WebsocketService).announce(message, filter),
})
await appModelManager.registerInternalAppModels(fooAppModel, ...)
```

The options type combines store and API setup needs:

```typescript
export type FooPluginOptions = FooStoreSetupOptions & FooApiSetupOptions
```

### Key Rules

- `configure()` must be called before `setup()` -- add a guard
- `configure()` returns `this` for chaining
- `declare private injector: Injector` is auto-injected by FuryStack DI -- do NOT add `@Injected`
- `getEntitySyncModels()` is optional; only implement if the plugin has entities that need WebSocket sync
- Always use `entitySyncConfig()` helper when returning entity sync configs -- it enforces `primaryKey` matches a real property on the model at compile time

## Schema Generation

Each plugin common package generates its own schemas:

```typescript
// plugins/<name>/common/src/bin/create-schemas.ts
import { generateSchemas } from 'common/bin/schema-utils'

generateSchemas([
  { inputFile: './src/models/*.ts', outputFile: './schemas/<name>-entities.json', type: '*' },
  { inputFile: './src/apis/<name>.ts', outputFile: './schemas/<name>-api.json', type: '*' },
]).catch((error) => {
  console.error('<Name> schema generation failed', error)
  process.exit(1)
})
```

Plugin service packages import schemas from their own common package:

```typescript
import fooApiSchema from '@pi-rat/foo-common/schemas/foo-api.json' with { type: 'json' }
```

## Type Safety at Plugin Boundaries

Plugin routes and types are not statically known to the core `AppPaths` type. This creates type friction at certain boundaries.

### Entity Sync Config

Use the `entitySyncConfig()` helper from `common` to validate that `primaryKey` is a real property on the model:

```typescript
import { entitySyncConfig, LogEntry } from 'common'

// ✅ Good -- primaryKey validated against model properties
entitySyncConfig({ model: LogEntry, primaryKey: 'id' })

// ❌ Compile error -- 'nonexistent' is not a key of LogEntry
entitySyncConfig({ model: LogEntry, primaryKey: 'nonexistent' })

// ❌ Avoid -- unvalidated inline object (typo compiles without error)
{ model: LogEntry, primaryKey: 'nonexistent' }
```

### Route Path Constants

Define typed `as const` constants for entity route paths to catch typos at compile time. Core entity paths live in `ENTITY_PATHS` (from `entity-routes.tsx`). Plugin entity paths are exported as named constants from the plugin's registration module:

```typescript
// ✅ Good -- typed constant shared between registration and navigation
export const IOT_ENTITY_ROUTE = '/iot-devices' as const

registry.registerEntityRoute(IOT_ENTITY_ROUTE, { ... })
registry.navigateToEntityRoute(injector, IOT_ENTITY_ROUTE)

// ❌ Avoid -- duplicated string literals across files
registry.registerEntityRoute('/iot-devices', { ... })
// in another file:
registry.navigateToEntityRoute(injector, '/iot-devics') // typo compiles silently
```

### Navigation to Entity Routes

**Always use `EntityRouteRegistry.navigateToEntityRoute()`** for entity navigation -- both in plugin code AND core code. It validates the path is registered and builds the full `/entities/<path>` URL:

```typescript
// ✅ Good -- use registry navigation with typed constant
injector.getInstance(EntityRouteRegistry).navigateToEntityRoute(injector, IOT_ENTITY_ROUTE, {
  queryString: serializeToQueryString({ gedst: { mode: 'edit', currentId: device.name } }),
})

// ❌ Avoid -- raw LocationService with unvalidated string
injector.getInstance(LocationService).navigate('/entities/iot-devices')
```

### AppPaths and Plugin Routes

`AppPaths` is derived from the static `appRoutes` object and does NOT include dynamically registered plugin routes. This is a deliberate trade-off: core navigation gets full type safety via `AppLink`, while plugin routes use typed constants for typo prevention but not exhaustive path checking.

### Widget Registration

`WidgetRegistry` provides two registration methods:

- `registerWidget(type, renderer)` -- for types in the core `Widget` union (type-safe via `Extract`)
- `registerPluginWidget<T>(type, renderer)` -- for plugin-defined widget types not in the core union

```typescript
// ✅ Good -- core widget (type checked against Widget union)
registry.registerWidget('html', (p) => <HtmlWidget {...p} />)

// ✅ Good -- plugin widget (type checked against custom props type)
registry.registerPluginWidget<MyPluginWidget>('my-plugin-widget', (p) => <MyWidget {...p} />)
```

### Websocket Message Types

When `common` needs to reference a plugin model type (e.g., `Device` in websocket messages), use an inline structural type instead of importing from the plugin package. This avoids a circular dependency from `common` -> `@pi-rat/*`:

```typescript
// ✅ Good -- inline shape in common
export type WebsocketDeviceInfo = { name: string; ipAddress?: string; macAddress?: string }
```

To prevent drift between the inline type and the plugin model, add a compile-time assertion in the **plugin** package (not in common):

```typescript
// ✅ Good -- in the plugin's service package (e.g. setup-iot-api.ts)
import type { WebsocketDeviceInfo } from 'common'
import type { Device } from '@pi-rat/iot-common'

type _AssertDeviceExtendsWsInfo = Device extends WebsocketDeviceInfo ? true : never
const _assertDeviceCompat: _AssertDeviceExtendsWsInfo = true
void _assertDeviceCompat

// ❌ Avoid -- no assertion, types can drift silently
```

### `as unknown as` Casts

When an `as unknown as` double cast is unavoidable (e.g., upstream library type mismatch), always:

1. Add a `TODO` comment referencing the upstream cause
2. Cast to the library's own type (via `Parameters<typeof Fn>[0]`) rather than a hand-written shape
3. Explain why the runtime behavior is correct despite the type mismatch

```typescript
// ✅ Good -- narrow cast with upstream tracking
// TODO(@furystack/rest-service): Validate expects additionalProperties as boolean,
// but ts-json-schema-generator emits { "type": "object" } for Record<string, string[]>.
const schema = installApiSchema as unknown as Parameters<typeof Validate>[0]['schema']

// ❌ Avoid -- hand-written shape that can silently diverge
const schema = installApiSchema as unknown as { definitions: Record<string, { ... }> }
```

### Type Guards Over Casts

When narrowing a union type (e.g., `Config` to `IotConfig`), prefer a type guard over a bare `as` cast:

```typescript
// ✅ Good -- runtime check validates the narrowing
const isIotConfig = (config: Config): config is Config & IotConfig => config.id === 'IOT_CONFIG'

// ❌ Avoid -- unsafe cast with no runtime validation
const loaded = (await this.configDataSet.get(injector, 'IOT_CONFIG')) as IotConfig
```
