<!-- version-type: minor -->

# common

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

- Added `ScanProgress` type and helper functions (`createScanProgress`, `updateScanProgress`, `getProcessedCount`) to track movie scan progress with granular status counts
- Extended `LinkMovie` result status with `rate-limited`, `metadata-not-found`, `omdb-not-configured`, and `omdb-error` to provide more specific failure reasons instead of generic errors
- Added `LinkMovieStatus` type alias for convenient reuse of link movie result statuses

## ⬆️ Dependencies

- Upgraded `@furystack/core` to `^15.2.3`, `@furystack/entity-sync` to `^1.0.4`, and `@furystack/rest` to `^8.0.41`
