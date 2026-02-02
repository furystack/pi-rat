# Script Execution Guidelines

## Package Manager Detection

### Automatic Package Manager Selection

- **Always detect the package manager** based on lockfile presence
- Use the correct package manager for the project
- Never assume npm when yarn is used (or vice versa)

**Detection Logic:**

- If `yarn.lock` exists → Use `yarn`
- If `package-lock.json` exists → Use `npm`
- If `pnpm-lock.yaml` exists → Use `pnpm`

```bash
# ✅ Good - using the correct package manager (pi-rat uses yarn)
yarn install
yarn build
yarn test

# ❌ Avoid - using wrong package manager
npm install       # When yarn.lock exists
npm run build     # Should be: yarn build
```

### Package Manager Commands

When executing package.json scripts:

```bash
# ✅ Good - using yarn (pi-rat uses yarn)
yarn start:service
yarn start:frontend
yarn build
yarn test
yarn test:e2e

# ❌ Avoid - mixing package managers
npm install  # when yarn.lock exists
```

## PI-RAT Project Scripts

Based on pi-rat's `package.json`:

```json
{
  "scripts": {
    "build": "tsc -b common service frontend && yarn workspace frontend build",
    "create-schemas": "yarn workspace common create-schemas",
    "test:e2e:install": "yarn playwright test --grep @install --project chromium",
    "test:e2e": "yarn playwright test --grep-invert @install",
    "test": "vitest",
    "start:service": "yarn workspace service start",
    "start:frontend": "yarn workspace frontend start",
    "clean": "rimraf service/dist frontend/dist **/tsconfig.tsbuildinfo tsconfig.tsbuildinfo common/dist",
    "lint": "eslint .",
    "prettier:check": "prettier --check .",
    "prettier:write": "prettier --write ."
  }
}
```

**Development:**

```bash
yarn start:service     # Start backend service
yarn start:frontend    # Start frontend dev server
```

**Build & Type Check:**

```bash
yarn build             # Build all workspaces (includes type checking)
yarn create-schemas    # Generate schemas from API definitions
yarn clean             # Clean build artifacts
```

**Testing:**

```bash
yarn test              # Unit tests with vitest
yarn test:e2e:install       # Install test (run once)
yarn test:e2e               # E2E tests with Playwright
```

**Code Quality:**

```bash
yarn lint              # Run ESLint
yarn prettier:write    # Format code
yarn prettier:check    # Check formatting without changes
```

**Version Management:**

```bash
yarn bumpVersions      # Interactively bump versions
yarn applyVersionBumps # Apply version bumps
```

## Workspace Commands

### Running Scripts in Specific Workspaces

```bash
# ✅ Good - workspace-specific commands
yarn workspace common create-schemas
yarn workspace service start
yarn workspace frontend start
yarn workspace frontend build

# ❌ Avoid - running from wrong directory
cd common && yarn create-schemas  # Prefer workspace command
```

### Cross-Workspace Dependencies

When workspaces depend on each other:

```bash
# ✅ Good - build order respects dependencies
yarn build  # Builds common first, then service and frontend
```

## Script Simplification

### Avoid Unnecessary Directory Changes

- **Don't use `cd` if already in the correct directory**
- Check current working directory before changing
- Use workspace commands instead of cd

```bash
# ✅ Good - using workspace commands
yarn workspace service start

# ❌ Avoid - unnecessary cd
cd service && yarn start

# ✅ Good - cd only when necessary for multiple commands
cd e2e && yarn playwright test --grep @install
```

### Use package.json Scripts

Prefer using defined npm scripts over direct command execution:

```bash
# ✅ Good - using defined scripts
yarn test
yarn lint
yarn prettier:write

# ❌ Avoid - bypassing package.json scripts
vitest
eslint .
prettier --write .
```

## Build Scripts Best Practices

### Production Build Sequence

```bash
# ✅ Good - production build sequence
yarn lint           # Check code quality
yarn test      # Run unit tests
yarn build          # Build and type check all workspaces
```

### Development Workflow

```bash
# ✅ Good - development workflow
# Terminal 1:
yarn start:service

# Terminal 2:
yarn start:frontend
```

### CI/CD Pipeline Scripts

```bash
# ✅ Good - CI/CD sequence
yarn install --frozen-lockfile  # Ensure exact versions
yarn lint                       # Lint check
yarn prettier:check             # Format check
yarn test:                  # Unit tests
yarn build                      # Type check and build
yarn test:e2e:install           # Install E2E prerequisites (once)
yarn test:e2e                   # E2E tests
```

## Environment-Specific Script Execution

### Environment Variables

Use environment variables for configuration:

```bash
# ✅ Good - using environment variables
NODE_ENV=test yarn test
NODE_ENV=production yarn build

# ✅ Good - using cross-env for cross-platform compatibility
cross-env NODE_ENV=test vitest run
```

### Development vs Production

```bash
# Development
yarn start:service    # Dev mode with hot reload
yarn start:frontend   # Dev server with HMR

# Production
yarn build            # Production build
node service/dist/index.js  # Run production service
```

## Docker and Deployment

### Dockerization

```bash
# Build Docker image
yarn dockerize  # Equivalent to: docker build . --tag furystack/pi-rat:latest

# SSH into Docker container
yarn sshIntoDocker  # For debugging
```

## Common Script Patterns

### Pre-commit Checks

```bash
# ✅ Good - pre-commit hooks (via Husky)
yarn prettier:write    # Format changed files
yarn lint              # Lint changed files
```

### Clean and Rebuild

```bash
# ✅ Good - clean rebuild
yarn clean
yarn install
yarn build
```

### Test Workflows

```bash
# ✅ Good - test workflows
yarn test              # Quick feedback
yarn test:e2e:install       # One-time setup
yarn test:e2e               # Full E2E suite
```

## Troubleshooting Script Issues

### Package Manager Mismatch

```bash
# ❌ If you see: "The engine 'node' is incompatible with this module"
npm install  # Wrong package manager

# ✅ Fix: Use yarn
yarn install
```

### Stale Build Artifacts

```bash
# ✅ Good - clean before rebuild
yarn clean
yarn build
```

### Workspace Dependency Issues

```bash
# ✅ Good - rebuild all workspaces
yarn clean
yarn install
yarn build
```

## Summary

**Key Principles:**

1. **Use yarn** - pi-rat uses yarn (yarn.lock exists)
2. **Workspace commands** - Use `yarn workspace <name> <script>`
3. **Use package.json scripts** - Don't bypass defined scripts
4. **Avoid unnecessary cd** - Use workspace commands instead
5. **Build order matters** - common → service/frontend
6. **Clean builds** - Use `yarn clean` when needed
7. **Frozen lockfile in CI** - Use `--frozen-lockfile` for reproducible builds
8. **Environment variables** - Use for configuration
9. **Pre-commit hooks** - Automated via Husky
10. **Docker for deployment** - Use `yarn dockerize`

**Common Commands:**

- Development: `yarn start:service` + `yarn start:frontend`
- Build: `yarn build`
- Test: `yarn test` + `yarn test:e2e`
- Format: `yarn prettier:write`
- Lint: `yarn lint`
- Clean: `yarn clean`
- Schemas: `yarn create-schemas`

**Workspace Structure:**

- `common` - Shared types and APIs
- `service` - Backend service
- `frontend` - Frontend application
