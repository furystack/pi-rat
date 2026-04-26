<!-- version-type: patch -->

# pi-rat

## ⬆️ Dependencies

### FuryStack major version upgrades

Aligned the workspace with the next major releases of the FuryStack libraries. The
upgrade required adapting the codebase to several breaking API changes; see the
`service` and `frontend` changelogs for details.

- Bumped `@furystack/eslint-plugin` to `^3.0.0` (root devDependency)
- Bumped FuryStack runtime packages across `common`, `frontend` and `service`
  workspaces to their new major versions (`@furystack/core@17`,
  `@furystack/inject@13`, `@furystack/logging@9`, `@furystack/rest@10`,
  `@furystack/rest-service@14`, `@furystack/rest-client-fetch@9`,
  `@furystack/repository@11`, `@furystack/security@8`,
  `@furystack/sequelize-store@7`, `@furystack/cache@7`,
  `@furystack/entity-sync@2`, `@furystack/entity-sync-service@2`,
  `@furystack/entity-sync-client@3`, `@furystack/websocket-api@14`,
  `@furystack/utils@9`, `@furystack/shades@15`,
  `@furystack/shades-common-components@17`, `@furystack/shades-lottie@11`,
  `@furystack/shades-mfe@5`)
