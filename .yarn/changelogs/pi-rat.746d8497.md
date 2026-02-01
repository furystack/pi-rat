<!-- version-type: patch -->
# pi-rat

## 🔧 Chores

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
