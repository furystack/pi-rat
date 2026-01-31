# Versioning and Changelog Guidelines

## Overview

This project follows [Semantic Versioning (semver)](https://semver.org/) and maintains changelogs following [Keep a Changelog](https://keepachangelog.com/) format.

**CRITICAL RULE**: Every major or minor version bump MUST have a corresponding CHANGELOG.md entry with the version number and date.

**PHILOSOPHY**: Changelogs are **user documentation**, not git logs. Write for package consumers who need to understand what changed, why it matters, and how to adapt their code.

## Automated Validation

This project includes automated changelog validation via `yarn changelog check` command. The validation enforces:

### What Gets Validated

The `yarn changelog check` command validates changelog drafts in `.yarn/changelogs/` against version manifests:

**Critical Requirements (Errors):**

- Every release in `.yarn/versions/*.yml` must have a corresponding changelog file
- Major releases MUST have a filled "💥 Breaking Changes" section
- At least one section must have content (no empty changelogs)
- Version type in changelog must match the version manifest (patch/minor/major)

**Quality Guidelines (Not Enforced by Validation):**

While not automatically validated, follow these best practices:

- Major versions: Include migration guide with before/after code examples
- Minor versions: Document new features in "✨ Features" section
- Be specific: Avoid vague terms like "updated", "refactored", "improved"
- Write for users: Explain what changed and why it matters, not just what you did

### CI Integration

The validation runs automatically on:

- Pull requests to `master`
- Pushes to feature branches

See `.github/workflows/check-changelog.yml` for CI configuration.

## Semantic Versioning

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes that require consumer code changes
- **MINOR** (X.Y.0): New features, backward-compatible additions
- **PATCH** (X.Y.Z): Bug fixes, backward-compatible fixes

### Examples

```
1.5.3 → 2.0.0  (major: breaking changes)
1.5.3 → 1.6.0  (minor: new features)
1.5.3 → 1.5.4  (patch: bug fixes)
```

## Version Management with Yarn

This project uses Yarn's deferred versioning:

1. Run `yarn bumpVersions` to interactively stage version bumps
2. Yarn creates files in `.yarn/versions/*.yml`
3. CD pipeline runs `yarn applyReleaseChanges` automatically
4. **DO NOT** manually run `yarn applyReleaseChanges`
5. **DO NOT** manually edit `package.json` versions

### Version Bump Commands

```bash
# Interactive version bump selection (recommended)
yarn bumpVersions

# Or use direct yarn version commands:
yarn version major  # Stage a major version bump
yarn version minor  # Stage a minor version bump
yarn version patch  # Stage a patch version bump
```

### Applying Changes (CD Pipeline Only)

The `yarn applyReleaseChanges` command:

1. Applies version bumps from `.yarn/versions/*.yml` to `package.json` files
2. Applies changelog drafts from `.yarn/changelogs/` to `CHANGELOG.md` files
3. Runs Prettier to format the changes

```bash
# This is run by the CD pipeline - DO NOT run manually
yarn applyReleaseChanges
```

## CHANGELOG.md Requirements

### Critical Rules

**💀 CRITICAL - Major Version Bumps:**

- ✅ MUST have CHANGELOG.md with version number and date
- ✅ MUST document ALL breaking changes with examples
- ✅ MUST include migration guide
- ✅ MUST show "before/after" code examples
- ✅ Version format: `## [X.0.0] - YYYY-MM-DD` (NOT `[Unreleased]`)

**🔥 HIGH - Minor Version Bumps:**

- ✅ MUST have CHANGELOG.md with version number and date
- ✅ MUST document new features
- ✅ SHOULD include usage examples
- ✅ Version format: `## [X.Y.0] - YYYY-MM-DD`

**🤔 MEDIUM - Patch Version Bumps:**

- ✅ SHOULD have CHANGELOG.md entry
- ✅ SHOULD document bug fixes
- ✅ Version format: `## [X.Y.Z] - YYYY-MM-DD`

### Determining Version Number

When `.yarn/versions/*.yml` files exist in your changes:

1. **Read the version file:**

   ```yaml
   releases:
     'common': major
     'service': major
   ```

2. **Look up current version** in `package.json`:

   ```json
   {
     "version": "1.5.3"
   }
   ```

3. **Calculate next version:**
   - `major`: 1.5.3 → 2.0.0
   - `minor`: 1.5.3 → 1.6.0
   - `patch`: 1.5.3 → 1.5.4

4. **Use in CHANGELOG.md:**
   ```markdown
   ## [2.0.0] - 2025-01-30
   ```
   **NOT** `[Unreleased]`

## CHANGELOG.md Format

### File Structure

```markdown
# Changelog

All notable changes to the `package-name` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [X.Y.Z] - YYYY-MM-DD

### 🚨 Breaking Changes (for major versions)

#### Descriptive Title of Breaking Change

Explain what changed and why it matters to users.

**Examples:**

\`\`\`typescript
// ❌ Before
oldAPI(param1, param2)

// ✅ After
newAPI({ param1, param2 })
\`\`\`

**Impact:** Who is affected and what they need to do.

**Migration:** Step-by-step instructions.

### ✨ Added (for minor versions)

#### New Feature Name

Describe the feature and its benefits to users.

**Usage:**

\`\`\`typescript
import { NewFeature } from 'common'

const result = NewFeature({ option: 'value' })
\`\`\`

**Why This Matters:**

Explain the value and use cases.

### 🔧 Changed

- **What changed**: Describe the change
- **Why**: Explain the reasoning
- **Impact**: Who is affected (if any)

### 🐛 Fixed (for patch versions)

- **Fixed [specific issue]**: Describe what was broken and how it's fixed
- **Root cause**: Brief explanation (if relevant)

### 🗑️ Deprecated

- **Deprecated [feature/API]**: What's deprecated, when it will be removed, what to use instead

### ❌ Removed

- **Removed [feature]**: What was removed, why, and alternatives

### 📦 Dependencies

- **Updated**: `dependency-name` v1.x → v2.0 (reason for update)
- **Added**: `new-dependency` v1.0.0 (purpose)
- **Removed**: `old-dependency` (no longer needed because...)
```

### Changelog Sections

Use these sections as appropriate:

- **🚨 Breaking Changes**: Changes that break backward compatibility (required for major)
- **✨ Added**: New features (required for minor)
- **🔧 Changed**: Changes to existing functionality
- **🐛 Fixed**: Bug fixes (required for patch)
- **🗑️ Deprecated**: Soon-to-be-removed features
- **❌ Removed**: Removed features
- **🔒 Security**: Security fixes
- **📦 Dependencies**: Dependency updates

### Writing Style: Documentation, Not Git Log

**CRITICAL:** Changelogs are documentation for users, not a formatted git history. Write for your audience.

#### ❌ Git Log Style (DON'T DO THIS)

```markdown
### Changed

- Updated API methods
- Fixed some bugs
- Refactored internal code
- Updated dependencies
```

**Problems:**

- Too vague - users don't know what changed
- No context - why should users care?
- No examples - how do users adapt?
- Developer-focused - not user-focused

#### ✅ Documentation Style (DO THIS)

**For Simple Changes:**

```markdown
### 🚨 Breaking Changes

#### Method Renames

- `getUserData()` → `getUser()`
- `saveUserData()` → `updateUser()`
- `deleteUserData()` → `deleteUser()`

Update all method calls to use the new names.
```

**For Complex Changes:**

```markdown
### 🚨 Breaking Changes

#### API Methods Now Use Object Parameters

Methods now accept a single object parameter instead of multiple arguments:

\`\`\`typescript
// Before
await client.updateUser(id, name, email)

// After
await client.updateUser({ id, name, email })
\`\`\`

This makes optional parameters easier and improves type safety. Update all direct API calls.

**Common issue:** TypeScript error "Expected 1 argument, but got 3"
**Solution:** Wrap your arguments in an object with named properties.
```

## Changelog Validation Checklist

### Automated Validation (CI)

The `yarn changelog check` command validates:

- ✅ Every release in `.yarn/versions/*.yml` has a corresponding changelog draft in `.yarn/changelogs/`
- ✅ Major releases have filled "💥 Breaking Changes" section
- ✅ At least one section has content (no empty changelogs)
- ✅ Version type matches between manifest and changelog draft

### Manual Review Checklist

When reviewing code with version bumps, verify:

#### For Major Versions (💀 Critical)

**Content Quality:**

- [ ] All breaking changes are documented with descriptive titles
- [ ] Each breaking change explains WHAT, WHY, and WHO is affected
- [ ] Each breaking change has before/after code examples
- [ ] Migration guide is included with step-by-step instructions
- [ ] Dependencies are documented with reasons for updates

**Writing Style:**

- [ ] Written as documentation, not git log
- [ ] User-focused language (not developer-focused)
- [ ] Clear, actionable instructions
- [ ] No vague terms like "improved", "updated", "fixed some bugs"

#### For Minor Versions (🔥 High)

**Content Quality:**

- [ ] New features are documented with descriptive titles
- [ ] Each feature explains purpose and benefits
- [ ] Usage examples are provided
- [ ] Dependencies are documented

#### For Patch Versions (🤔 Medium)

**Content Quality:**

- [ ] Bug fixes are specific (not "fixed bugs")
- [ ] Each fix describes what was broken

## Tools and Commands

### Automated Changelog Validation

```bash
# Validate all changelog drafts against version manifests
yarn changelog check

# Show verbose output
yarn changelog check -v
```

### Manual Validation Commands

```bash
# Check for Version Manifests
ls -la .yarn/versions/

# View version manifest content
cat .yarn/versions/*.yml

# Check for Changelog Drafts
ls -la .yarn/changelogs/

# View changelog draft content
cat .yarn/changelogs/*.md

# Find Current Version
jq -r '.version' common/package.json
```

## Best Practices

### 1. Write Changelogs for Your Users

Changelogs are for consumers of your package, not developers:

- ✅ Explain **what** changed and **why** it matters to them
- ✅ Show concrete **examples** they can copy-paste
- ✅ Provide **migration paths** for breaking changes
- ❌ Don't just list commit messages
- ❌ Don't use internal jargon

### 2. Be Specific and Actionable

```markdown
❌ Bad: "Improved API"
✅ Good: "Added pagination to getUserList() - now supports page and limit parameters"

❌ Bad: "Fixed bugs"
✅ Good: "Fixed Injector not disposing child instances when parent is disposed"
```

### 3. Group Related Changes

```markdown
✅ Good organization:

### 🚨 Breaking Changes

All breaking changes together with migration guide

### ✨ Added

All new features together

### 🐛 Fixed

All bug fixes together
```

## Summary

**Remember:**

1. 💀 **Major/Minor versions** → CHANGELOG.md is **REQUIRED**
2. 🤔 **Patch versions** → CHANGELOG.md is **RECOMMENDED**
3. 📅 **Use actual version and date**, not `[Unreleased]`
4. 📝 **Document breaking changes** with examples and migration guides
5. 🎯 **Write for your users**, not just for the git history
6. ✅ **Be specific, actionable, and clear**

When in doubt, over-communicate. Users prefer too much information over too little.
