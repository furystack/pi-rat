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

- Added `PasswordResetTokenModel` Sequelize model and store registration to support the new password reset token functionality from `@furystack/security` ^7.0.1
- Registered `PasswordResetToken` and `DefaultSession` datasets in the repository
- Simplified `useHttpAuthentication()` setup by removing explicit `getUserStore` and `getSessionStore` options, now auto-resolved by `@furystack/rest-service` ^12.1.0

## ⬆️ Dependencies

- Updated `@furystack/core` from ^15.1.0 to ^15.2.2
- Updated `@furystack/entity-sync` from ^0.1.1 to ^1.0.3
- Updated `@furystack/entity-sync-service` from ^0.1.1 to ^1.0.3
- Updated `@furystack/repository` from ^10.0.37 to ^10.1.3
- Updated `@furystack/rest` from ^8.0.37 to ^8.0.40
- Updated `@furystack/rest-service` from ^11.0.5 to ^12.1.0
- Updated `@furystack/security` from ^6.0.37 to ^7.0.1
- Updated `@furystack/sequelize-store` from ^6.0.38 to ^6.0.41
- Updated `@furystack/websocket-api` from ^13.1.9 to ^13.1.13
- Updated `@types/formidable` from ^3.4.6 to ^3.4.7
- Updated `@types/node` from ^25.3.0 to ^25.3.1
