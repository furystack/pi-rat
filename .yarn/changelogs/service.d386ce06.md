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

## 🐛 Bug Fixes

- Fixed `FfprobeService` not disposing its `piRatFileCache` and `physicalFileCache` Cache instances by implementing the `Disposable` protocol

## ⬆️ Dependencies

- Bumped `@furystack/cache` from `^6.1.0` to `^6.1.1`
- Bumped `@furystack/core` from `^15.2.3` to `^15.2.4`
- Bumped `@furystack/entity-sync` from `^1.0.4` to `^1.0.5`
- Bumped `@furystack/entity-sync-service` from `^1.0.5` to `^1.0.6`
- Bumped `@furystack/inject` from `^12.0.31` to `^12.0.32`
- Bumped `@furystack/logging` from `^8.1.0` to `^8.1.1`
- Bumped `@furystack/repository` from `^10.1.4` to `^10.1.5`
- Bumped `@furystack/rest` from `^8.0.41` to `^8.0.42`
- Bumped `@furystack/rest-service` from `^12.2.0` to `^12.2.1`
- Bumped `@furystack/security` from `^7.0.2` to `^7.0.3`
- Bumped `@furystack/sequelize-store` from `^6.0.42` to `^6.0.43`
- Bumped `@furystack/utils` from `^8.2.0` to `^8.2.1`
- Bumped `@furystack/websocket-api` from `^13.2.0` to `^13.2.1`
- Bumped `@types/node` from `^25.3.3` to `^25.3.5`
