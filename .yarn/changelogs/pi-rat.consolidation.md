<!-- version-type: patch -->
# pi-rat

## 🔧 Chores

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
