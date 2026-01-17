# review-changes

Review all changes on the current branch compared to the upstream branch.

## Analysis Required

Check for:

**Code Quality & Bugs:**

- Potential bugs, edge cases, or runtime errors
- Code smells, anti-patterns, or violations of repository rules (check `.cursor/rules/*`)
- Newly added TODO/FIXME comments that should be addressed
- Suspicious or unclear code changes
- Business logic changes that need scrutiny

**Standards & Compliance:**

- TypeScript errors or type safety issues
- Linting violations
- Breaking changes (API, props, contracts)
- Accessibility violations (keyboard nav, ARIA where applicable)
- Error handling patterns (RequestError, Observable error states)
- Observable and Cache usage patterns

**FuryStack-Specific:**

- RequestError usage (proper HTTP codes: 409, 400, 401, 404, 500)
- Observable patterns (ObservableValue, subscriptions, disposal)
- Cache patterns (get, getObservable, setExplicitValue)
- Shades component patterns (shadowDomName, useObservable, useDisposable)
- Injectable services and dependency injection
- Action patterns (RequestAction, proper logging)
- Navigation patterns (navigateToRoute usage)

**Testing & Coverage:**

- Missing or inadequate test coverage for new/changed code
- Test quality and edge case coverage

**Performance & Security:**

- Performance concerns (unnecessary re-renders, missing disposal)
- Security vulnerabilities or data exposure

**Documentation:**

- Missing or outdated documentation for significant changes

## Output Format

**1. Summary:** Brief overview of changes (2-3 sentences)

**2. Issues by Priority:**

- 💀 **Critical:** Must fix before merge
- 🔥 **High:** Should fix before merge
- 🤔 **Medium:** Consider addressing
- 💚 **Low:** Nice to have

For each issue, be specific: file, line, problem, suggested fix.

**3. Test Coverage:** Assess coverage quality. Warn if inadequate.

**4. Pull Request Description:** Generate as a copyable markdown code block with relevant emojis per header.

**5. Learnings & Rule Updates:**

At the end of the review, summarize any patterns or learnings that emerged from the review (or from user feedback during the review process) that could be codified into rules. Ask the user if they would like to:

- Update an existing rule file in `.cursor/rules/`
- Create a new rule file for the pattern
- Skip persisting the learning

This ensures that recurring feedback and discovered patterns are captured for future development.

**Style:** Be critical, specific, and concise. No fluff. If unsure, ask for clarification.
