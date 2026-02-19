<!-- version-type: patch -->

# service

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ♻️ Refactoring

### Migrate from `StoreManager`/`PhysicalStore` to `DataSet`/`getDataSetFor`

All service-layer data access now uses `DataSet` from `@furystack/repository` instead of directly accessing `PhysicalStore` via `StoreManager`. This enables authorization-aware data operations through the repository layer.

Affected modules: AI (ollama, setup), chat actions (accept/reject/revoke invitation, setup), drives (file watcher), identity (register, setup), install (service installer), IoT (device availability), logging (db logger), media (scan, OMDB, movie maintainer, stream caches, ensure/link utils), ffprobe, and patcher (setup, run, orphan check).

### Use `useSystemIdentityContext` for elevated operations

Background services and event handlers now use `useSystemIdentityContext` to create system-level injectors with named identities (e.g. `ollama-service`, `chat-events`, `movie-maintainer`) instead of accessing stores directly without authorization context.

- Move `sequelize?.sync()` call from `service.ts` to `setup-identity-store.ts` for proper initialization ordering

## ⬆️ Dependencies

- Upgrade `@furystack/core` to `^15.1.0`
- Upgrade `@furystack/repository` to `^10.0.37`
- Upgrade `@furystack/rest` to `^8.0.37`
- Upgrade `@furystack/rest-service` to `^11.0.5`
- Upgrade `@furystack/security` to `^6.0.37`
- Upgrade `@furystack/sequelize-store` to `^6.0.38`
- Upgrade `@furystack/websocket-api` to `^13.1.9`
- Add `@furystack/entity-sync` `^0.1.1` for entity synchronization
- Add `@furystack/entity-sync-service` `^0.1.1` for server-side entity sync
- Upgrade `@types/node` to `^25.3.0`
