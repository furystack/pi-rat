# Changelog

## [1.0.18] - 2026-02-01

### ⬆️ Dependencies

- Updated lockfile dependencies
- Added `@furystack/yarn-plugin-changelog@^1.0.1` as dev dependency

### 🔧 Chores

### Cursor IDE Configuration Updates

Migrated from legacy Cursor commands to the new agents and skills structure.

**Changes:**

- Removed deprecated `.cursor/commands/review-changes.md` - superseded by new skills system
- Added `.cursor/agents/` directory with automated review agents:
  - `reviewer-changelog` - Validates changelog entries have high-quality, descriptive content
  - `reviewer-dependencies` - Checks for dependency-related issues
  - `reviewer-eslint` - Runs ESLint checks to catch linting violations
  - `reviewer-prettier` - Validates code formatting matches project standards
  - `reviewer-tests` - Runs unit tests and assesses test coverage
  - `reviewer-typescript` - Runs TypeScript type checking
  - `reviewer-versioning` - Validates version bump requirements
- Added `.cursor/skills/` directory with reusable skills:
  - `fill-changelog` - Automates filling changelog entries based on branch changes
  - `review-changes` - Orchestrates code review with multiple agents

### Project Consolidation

Standardized project configuration and updated CI workflows.

**Changes:**

- Renamed npm scripts from `prettier:write`/`prettier:check` to `format`/`format:check` for consistency
- Added format check step to Azure Pipelines
- Fixed duplicate and incorrectly formatted steps in Azure Pipelines
- Fixed 'conatiner' typo to 'container' in CI workflows
- Updated GitHub Actions to latest versions:
  - `actions/checkout` from v3 to v4
  - `actions/setup-node` from v2 to v4
  - `codecov/codecov-action` from v2 to v5
  - `github/codeql-action/*` from v2 to v3
  - `docker/setup-qemu-action` from v2 to v3
  - `docker/setup-buildx-action` from v2 to v3

### ✨ Features

### Changelog Generation Plugin

Integrated `@furystack/yarn-plugin-changelog` for automated changelog generation and validation.

**New Commands:**

- `yarn changelog create` - Creates changelog draft files for packages with version bumps
- `yarn changelog check` - Validates changelog entries have content
- `yarn changelog apply` - Merges changelog drafts into package CHANGELOG.md files

**Configuration:**

The plugin uses `changesetBaseRefs` in `.yarnrc.yml` to determine the base branch for detecting changes.

### 📦 Build

- Renamed `applyVersionBumps` script to `applyReleaseChanges` - now combines version apply, changelog apply, and formatting in a single command
- Added `.yarn/changelogs` to `.gitignore` allowlist for tracking changelog drafts

### 👷 CI

- Added `check-changelog.yml` workflow to validate changelog entries on pull requests
- Updated `check-version-bump.yml` to use GitHub Actions v4 (`actions/checkout@v4`, `actions/setup-node@v4`)
