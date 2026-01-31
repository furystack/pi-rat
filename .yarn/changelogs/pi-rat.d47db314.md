<!-- version-type: patch -->
# pi-rat

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

## ✨ Features

### Changelog Generation Plugin

Integrated `@furystack/yarn-plugin-changelog` for automated changelog generation and validation.

**New Commands:**

- `yarn changelog create` - Creates changelog draft files for packages with version bumps
- `yarn changelog check` - Validates changelog entries have content
- `yarn changelog apply` - Merges changelog drafts into package CHANGELOG.md files

**Configuration:**

The plugin uses `changesetBaseRefs` in `.yarnrc.yml` to determine the base branch for detecting changes.

## 📦 Build

- Renamed `applyVersionBumps` script to `applyReleaseChanges` - now combines version apply, changelog apply, and formatting in a single command
- Added `.yarn/changelogs` to `.gitignore` allowlist for tracking changelog drafts

## 👷 CI

- Added `check-changelog.yml` workflow to validate changelog entries on pull requests
- Updated `check-version-bump.yml` to use GitHub Actions v4 (`actions/checkout@v4`, `actions/setup-node@v4`)

## ⬆️ Dependencies

- Added `@furystack/yarn-plugin-changelog@^1.0.1` as dev dependency
