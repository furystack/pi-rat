---
name: review-changes
description: Review all changes on the current branch. Use when the user asks for a code review or PR review.
disable-model-invocation: false
inputs:
  - id: branch
    type: currentBranch
    description: The branch to review
---

# review-changes

Review all changes on the current branch compared to the upstream branch.

## Context

{{branch}}

## Determining the Base Branch

**IMPORTANT:** This repository uses `develop` as the integration branch, not `master` or `main`.

1. **Use `develop` as the default base branch** for all comparisons:

   ```bash
   git diff origin/develop...HEAD
   ```

2. **Verify by checking GitHub workflows** if unsure - look at `.github/workflows/*.yml` for `pull_request.branches` targets

3. **Use the correct git diff syntax:**
   - `origin/develop...HEAD` - shows changes in current branch since it diverged from develop
   - Run `git log --oneline origin/develop..HEAD` to see commits being reviewed

## Pre-flight: Detect Change Types

Before launching subagents, analyze what files changed:

```bash
git diff origin/develop...HEAD --name-only
```

**Conservative skip rules (only skip when 100% safe):**

| Reviewer                | Run         | Notes                                                      |
| ----------------------- | ----------- | ---------------------------------------------------------- |
| `reviewer-prettier`     | ✅ Always   | Formats `.md`, `.json`, `.ts`, `.tsx`, etc.                |
| `reviewer-versioning`   | ✅ Always   | Fast validation, can fail early                            |
| `reviewer-changelog`    | ✅ Always   | Fast validation, can fail early                            |
| `reviewer-dependencies` | Conditional | Run if ANY `package.json` changed                          |
| `reviewer-typescript`   | Conditional | Skip ONLY if NO `.ts`/`.tsx` in source directories changed |
| `reviewer-eslint`       | Conditional | Skip ONLY if NO `.ts`/`.tsx` in source directories changed |
| `reviewer-tests`        | Conditional | Skip ONLY if NO `.ts`/`.tsx` in source directories changed |
| `reviewer-complexity`   | Conditional | Skip ONLY if NO `.ts`/`.tsx` in source directories changed |

**When in doubt, run the check.** Fast failures are better than missed issues.

## Execution Strategy

**IMPORTANT:** Launch ALL applicable subagents in a SINGLE parallel batch.
Do NOT wait for one group to finish before starting another.

In one tool call batch, launch all applicable reviewers:

- `reviewer-prettier` (always)
- `reviewer-versioning` (always)
- `reviewer-changelog` (always)
- `reviewer-dependencies` (if any `package.json` changed)
- `reviewer-typescript` (if `.ts`/`.tsx` in `frontend/`, `service/`, or `common/` changed)
- `reviewer-eslint` (if `.ts`/`.tsx` in `frontend/`, `service/`, or `common/` changed)
- `reviewer-tests` (if `.ts`/`.tsx` in `frontend/`, `service/`, or `common/` changed)
- `reviewer-complexity` (if `.ts`/`.tsx` in `frontend/`, `service/`, or `common/` changed)

**Note:** `reviewer-dependencies` checks changelog documentation but does NOT create/modify changelogs. If both changelog and dependency changes exist, both reviewers run in parallel - the dependency reviewer only reads existing changelogs.

## Analysis Required

Check for:

**Code Quality & Bugs:**

- Potential bugs, edge cases, or runtime errors
- Code smells, anti-patterns, or violations of repository rules (check `.cursor/rules/*`)
- Newly added TODO/FIXME comments that should be addressed
- Suspicious or unclear code changes
- Business logic changes that need scrutiny

**Standards & Compliance:**

- Delegate to `reviewer-typescript` subagent to check for TypeScript errors
- Delegate to `reviewer-eslint` subagent to check for linting violations
- Delegate to `reviewer-prettier` subagent to check for formatting issues
- Breaking changes (API, props, contracts)
- Accessibility violations (keyboard nav, ARIA where applicable)

**FuryStack-Specific Patterns:**

- RequestError usage (proper HTTP codes: 409, 400, 401, 404, 500)
- Observable patterns (ObservableValue, subscriptions, disposal)
- Cache patterns (get, getObservable, setExplicitValue)
- Shades component patterns (customElementName, useObservable, useDisposable)
- Injectable services and dependency injection
- Action patterns (RequestAction, proper logging)
- Navigation patterns (navigateToRoute usage)

**Shades Styling Patterns:**

- Flag `useState()` used only for CSS-representable states (hover, focus, active)
- Recommend using `css` property with pseudo-selectors instead:

  ```typescript
  // ❌ Anti-pattern to flag
  const [isHovered, setIsHovered] = useState('hover', false)
  <div onMouseEnter={() => setIsHovered(true)} style={{ opacity: isHovered ? 1 : 0.7 }} />

  // ✅ Recommend instead
  css: { opacity: '0.7', '&:hover': { opacity: '1' } }
  ```

- Static `style` props in Shade definitions should use `css` instead

**Complexity Audit:**

- Delegate to `reviewer-complexity` subagent to flag overgrown components, services, and REST actions introduced or worsened by the branch (heuristics from `.cursor/rules/COMPLEXITY.mdc`)

**Testing & Coverage:**

- Delegate to `reviewer-tests` subagent to run unit tests and assess coverage
- Missing test coverage for new/changed code
- Test quality and edge case coverage

**Performance & Security:**

- Performance concerns (unnecessary re-renders, missing disposal)
- Security vulnerabilities or data exposure

**Versioning & Changelog:**

- Delegate to `reviewer-versioning` subagent to validate version bumps
- Delegate to `reviewer-changelog` subagent to validate changelog entries

**Dependencies:**

- Delegate to `reviewer-dependencies` subagent to validate dependency consistency across packages

**Documentation:**

- Missing or outdated documentation for significant changes

## Subagent Output Rules

**IMPORTANT:** Only include subagent results in the final output if they found errors or issues.

- If `reviewer-typescript` passes → Do NOT mention it in the output
- If `reviewer-eslint` passes → Do NOT mention it in the output
- If `reviewer-prettier` passes → Do NOT mention it in the output
- If `reviewer-tests` passes → Do NOT mention it in the output
- If `reviewer-versioning` passes → Do NOT mention it in the output
- If `reviewer-changelog` passes → Do NOT mention it in the output
- If `reviewer-dependencies` passes → Do NOT mention it in the output
- If `reviewer-complexity` passes → Do NOT mention it in the output

Only report subagent findings when they detect actual problems.

## Output Format

**1. Summary:** Brief overview of changes (2-3 sentences max)

**2. Issues by Priority:**

- 💀 **Critical:** Must fix before merge
- 🔥 **High:** Should fix before merge
- 🤔 **Medium:** Consider addressing
- 💚 **Low:** Nice to have

For each issue, be specific: file, line, problem, suggested fix.

**3. Test Coverage:** Assess coverage quality. Warn if inadequate.

**4. Changelog:** Generate a short, consistent changelog as a copyable markdown code block.

Format:

- Use present tense, imperative mood (e.g., "Add", "Fix", "Update", "Remove")
- One line per logical change (max 5-7 lines)
- Group by type if multiple changes: Features, Fixes, Refactors
- No verbose descriptions - keep each line under 80 characters

Example:

```
- Add user profile validation
- Fix observable memory leak in cache
- Update dependency injection patterns
```

**5. Pull Request Description:** Generate as a copyable markdown code block with:

- Relevant emoji per header
- Brief description of what the PR does
- **Remaining Tasks** checklist generated from found issues (if any), grouped by priority:

```markdown
## 📋 Remaining Tasks

### 💀 Critical

- [ ] Fix TypeScript error in `service/src/foo.ts:42`

### 🔥 High

- [ ] Add missing test for `handleSubmit` function

### 🤔 Medium

- [ ] Address memory leak in observable subscription
```

Omit empty priority sections. If no issues found, omit the entire Remaining Tasks section.

**6. Learnings & Rule Updates:**

At the end of the review, summarize any patterns or learnings that emerged from the review (or from user feedback during the review process) that could be codified into rules. Ask the user if they would like to:

- Update an existing rule file in `.cursor/rules/`
- Create a new rule file for the pattern
- Skip persisting the learning

This ensures that recurring feedback and discovered patterns are captured for future development.

**Style:** Be critical, specific, and concise. If unsure, ask for clarification.
