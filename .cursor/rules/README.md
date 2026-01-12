# Cursor Rules Overview

This directory contains coding guidelines and best practices for the PI-RAT FuryStack application. These rules are designed to be **intelligently auto-applied** based on file type and context.

## 🤖 Intelligent Auto-Apply System

Each rule file contains frontmatter metadata that tells Cursor **when** and **where** to automatically apply it:

- **Always Applied**: Foundation rules (`CODE_STYLE.mdc`, `TYPESCRIPT_GUIDELINES.mdc`) apply to all TypeScript files
- **Auto-Applied by File Type**: Rules automatically activate when you work on matching files
- **Context-Aware**: Cursor intelligently includes relevant rules based on what you're doing

### How It Works

When you open or edit a file, Cursor automatically loads the relevant rules based on:

1. **File extension** (`.tsx`, `.spec.ts`, `.ts`, etc.)
2. **File location** (`services/`, `actions/`, `components/`, etc.)
3. **File name patterns** (`package.json`, etc.)

## Rule Applicability Matrix

| Rule File                                                    | Auto-Apply | File Patterns                                               | Description                       |
| ------------------------------------------------------------ | ---------- | ----------------------------------------------------------- | --------------------------------- |
| [CODE_STYLE.mdc](./CODE_STYLE.mdc)                           | ✅ Always  | `**/*.ts`, `**/*.tsx`                                       | Formatting, naming, organization  |
| [TYPESCRIPT_GUIDELINES.mdc](./TYPESCRIPT_GUIDELINES.mdc)     | ✅ Always  | `**/*.ts`, `**/*.tsx`                                       | Type safety, NO `any`, generics   |
| [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md)             | 🎯 Auto    | `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.e2e.spec.ts`         | Vitest, Playwright, mocking       |
| [ERROR_HANDLING.md](./ERROR_HANDLING.md)                     | 🎯 Auto    | `**/*.ts`, `**/*.tsx`, `**/actions/**`, `**/services/**`    | RequestError, Observable errors   |
| [CACHE_HANDLING.md](./CACHE_HANDLING.md)                     | 🎯 Auto    | `**/*.ts`, `**/services/**`                                 | FuryStack Cache patterns          |
| [OBSERVABLE_STATE.md](./OBSERVABLE_STATE.md)                 | 🎯 Auto    | `**/*.ts`, `**/*.tsx`, `**/services/**`                     | ObservableValue, useObservable    |
| [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) | 🎯 Auto    | `**/*.ts`, `**/*.tsx`, `**/components/**`, `**/services/**` | Optimization, disposal            |
| [SCRIPT_EXECUTION.md](./SCRIPT_EXECUTION.md)                 | 🎯 Auto    | `package.json`, `**/*.sh`                                   | Package manager, CI/CD            |
| [BACKEND_PATTERNS.mdc](./BACKEND_PATTERNS.mdc)               | 📘 Manual  | Backend development                                         | API, actions, authentication      |
| [FRONTEND_PATTERNS.mdc](./FRONTEND_PATTERNS.mdc)             | 📘 Manual  | Frontend development                                        | Routing, Shades components, forms |
| [main.mdc](./main.mdc)                                       | 📘 Manual  | Overview                                                    | Quick start guide                 |

**Legend:**

- ✅ Always = Applied to all matching files automatically
- 🎯 Auto = Applied when file pattern matches
- 📘 Manual = Reference documentation (not auto-applied)

## Quick Reference by Task

### Creating a New API Endpoint

**Apply in order:**

1. **BACKEND_PATTERNS.mdc** - Action pattern, RequestError usage
2. **TYPESCRIPT_GUIDELINES.mdc** - Type safety, no `any`
3. **CODE_STYLE.mdc** - Naming, imports, file organization
4. **ERROR_HANDLING.md** - RequestError codes, logging

**Workflow:**

1. Define API in `common/src/apis/[module].ts`
2. Run `yarn create-schemas`
3. Create action in `service/src/app-models/[module]/actions/`
4. Register in `setup-[module]-rest-api.ts`

### Creating a New UI Component

**Apply in order:**

1. **FRONTEND_PATTERNS.mdc** - Shades component pattern, routing
2. **OBSERVABLE_STATE.md** - useObservable, useDisposable
3. **TYPESCRIPT_GUIDELINES.mdc** - Props types, type safety
4. **CODE_STYLE.mdc** - Naming, file structure

**Optional (based on complexity):**

- **CACHE_HANDLING.md** - If component uses cached data
- **ERROR_HANDLING.md** - If component handles async operations
- **PERFORMANCE_OPTIMIZATION.md** - If component is expensive

### Writing Tests

**Apply in order:**

1. **TESTING_GUIDELINES.md** - Test structure, mocking, Playwright
2. **TYPESCRIPT_GUIDELINES.mdc** - Type-safe mocks, no `any`
3. **CODE_STYLE.mdc** - Test file organization

**Test Patterns:**

- Unit tests: Vitest with hoisted mocks
- E2E tests: Playwright with semantic locators
- Observable testing: Subscribe to state changes
- Mock caches with ObservableValue

### Creating a Service

**Apply in order:**

1. **BACKEND_PATTERNS.mdc** or **OBSERVABLE_STATE.md** - Service patterns
2. **CACHE_HANDLING.md** - If service uses Cache
3. **TYPESCRIPT_GUIDELINES.mdc** - Injectable types, generics
4. **CODE_STYLE.mdc** - Class naming, organization
5. **ERROR_HANDLING.md** - Error handling in services

## Rule Categories

### 1. Foundation Rules (Apply Always)

These rules should be applied to all code:

- **CODE_STYLE.mdc**: Formatting, naming conventions, file organization
- **TYPESCRIPT_GUIDELINES.mdc**: Type safety, strict typing, no `any`

**Priority**: Critical
**Enforcement**: Automatic (ESLint, Prettier, TypeScript compiler)

### 2. FuryStack Patterns (Apply by Context)

Apply when working with FuryStack-specific features:

- **OBSERVABLE_STATE.md**: ObservableValue, useObservable, useDisposable
- **CACHE_HANDLING.md**: Cache configuration, methods, invalidation
- **BACKEND_PATTERNS.mdc**: Actions, RequestError, authentication
- **FRONTEND_PATTERNS.mdc**: Shades components, routing, forms

**Priority**: High
**Enforcement**: Code review, manual verification

### 3. Quality & Performance Rules

Apply when ensuring quality or optimizing:

- **TESTING_GUIDELINES.md**: Test structure, mocking, E2E patterns
- **ERROR_HANDLING.md**: RequestError, Observable errors, user-friendly messages
- **PERFORMANCE_OPTIMIZATION.md**: Disposal, debouncing, lazy loading

**Priority**: Medium to High
**Enforcement**: Test coverage, code review

### 4. Operational Rules

Apply when setting up infrastructure or scripts:

- **SCRIPT_EXECUTION.md**: Package manager detection, workspace commands

**Priority**: Medium
**Enforcement**: CI/CD validation

## Rule Priority Levels

### Critical (MUST follow)

- No `any` type (TYPESCRIPT_GUIDELINES.mdc)
- RequestError for API errors (ERROR_HANDLING.md)
- Proper disposal patterns (OBSERVABLE_STATE.md)
- shadowDomName for Shades components (FRONTEND_PATTERNS.mdc)

### High (SHOULD follow)

- TypeScript strict mode (TYPESCRIPT_GUIDELINES.mdc)
- Cache for data fetching (CACHE_HANDLING.md)
- Observable state management (OBSERVABLE_STATE.md)
- navigateToRoute for navigation (FRONTEND_PATTERNS.mdc)

### Medium (RECOMMENDED)

- Debouncing for user input (PERFORMANCE_OPTIMIZATION.md)
- Operation wrappers for loading states (OBSERVABLE_STATE.md)
- Hoisted mocks in tests (TESTING_GUIDELINES.md)
- Helper functions in E2E tests (TESTING_GUIDELINES.md)

## Context-Based Application

### Examples of Auto-Apply in Action

**Scenario 1: You open `user-service.ts` in `frontend/src/services/`**

- ✅ CODE_STYLE.mdc (always applied)
- ✅ TYPESCRIPT_GUIDELINES.mdc (always applied)
- ✅ OBSERVABLE_STATE.md (auto-applied: `**/services/**`)
- ✅ CACHE_HANDLING.md (auto-applied: `**/services/**`)
- ✅ ERROR_HANDLING.md (auto-applied: `**/services/**`)

**Scenario 2: You open `login.e2e.spec.ts`**

- ✅ CODE_STYLE.mdc (always applied)
- ✅ TYPESCRIPT_GUIDELINES.mdc (always applied)
- ✅ TESTING_GUIDELINES.md (auto-applied: test file)

**Scenario 3: You open `create-user-action.ts` in `service/src/app-models/auth/actions/`**

- ✅ CODE_STYLE.mdc (always applied)
- ✅ TYPESCRIPT_GUIDELINES.mdc (always applied)
- ✅ ERROR_HANDLING.md (auto-applied: `**/actions/**`)

**Scenario 4: You open `package.json`**

- ✅ SCRIPT_EXECUTION.md (auto-applied: package.json)

## Summary

**Core Philosophy:**

- **Type Safety First**: No `any`, strict TypeScript
- **Observable State**: Use ObservableValue for reactive state
- **Cache for Data**: Use FuryStack Cache instead of ad-hoc fetching
- **Error Handling**: RequestError with proper codes, Observable error states
- **Performance**: Proper disposal, debouncing, lazy loading
- **Testing**: Vitest + Playwright with minimal mocking

**Rule Application Strategy:**

1. Start with foundation rules (CODE_STYLE, TYPESCRIPT_GUIDELINES)
2. Apply context-specific rules based on task
3. Prioritize critical requirements over recommendations
4. Use intelligent detection based on file type and location

**Key Technologies:**

- Framework: FuryStack
- UI: Shades components
- State: ObservableValue
- Data: Cache from `@furystack/cache`
- Testing: Vitest + Playwright
- Package Manager: Yarn (workspaces)
