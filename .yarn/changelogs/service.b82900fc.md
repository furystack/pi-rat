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

## ✨ Features

- Added structured `ScanProgress` tracking to the movie scan action, logging progress every 50 files and returning final counts in the response
- Added exponential-backoff retry logic (up to 3 retries) to `OmdbClientService` for handling OMDB API rate limits gracefully
- Added `Semaphore(1)` to `OmdbClientService` to serialize OMDB API calls and avoid concurrent rate-limit hits
- Added `Semaphore(3)` to `FfprobeService` to limit concurrent `ffprobe` subprocess executions
- Added structured error logging and `onLoadError` listener to `FfprobeService` cache for surfacing background load failures

## ♻️ Refactoring

- Changed `linkMovie` to return granular status values (`rate-limited`, `metadata-not-found`, `omdb-not-configured`, `omdb-error`) instead of throwing `RequestError`, allowing the scan action to continue processing remaining files
- Changed `OmdbClientService.fetchOmdbMovieMetadata` and `fetchOmdbSeriesMetadata` to return discriminated `OmdbFetchResult<T>` unions instead of `T | undefined`
- Replaced `execAsync` shell-based `ffprobe` invocation with `execFileAsync` to avoid shell injection risks and improve argument handling
- Changed `OmdbClientService.init()` and `FileWatcherService.init()` to fire-and-forget async initialization instead of blocking, preventing startup hangs on slow external services
- Moved subtitle extraction to only run when `linkMovie` returns `linked` status, avoiding unnecessary work for already-linked or failed files

## 🧪 Tests

- Updated `linkMovie` tests to verify new granular status returns (`metadata-not-found`, `rate-limited`, `omdb-not-configured`, `omdb-error`) instead of asserting thrown exceptions
- Added dedicated test cases for each OMDB failure mode

## ⬆️ Dependencies

- Upgraded all `@furystack/*` packages to their latest patch/minor versions
