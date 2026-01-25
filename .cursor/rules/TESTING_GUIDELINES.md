# Testing Guidelines

## Test File Naming

### File Naming Conventions

- Use `*.spec.ts` or `*.spec.tsx` for unit and component tests
- Use `*.e2e.spec.ts` for Playwright E2E tests
- Co-locate tests with the files they test

```typescript
// ✅ Good - unit test file
// session-service.ts
// session-service.spec.ts

// ✅ Good - E2E test file
// e2e/login.e2e.spec.ts
```

## Test Structure

### Arrange-Act-Assert Pattern

Organize tests clearly using the Arrange-Act-Assert pattern:

```typescript
// ✅ Good - clear test structure
describe('SessionService', () => {
  it('should set current user when login succeeds', async () => {
    // Arrange
    const sessionService = injector.getInstance(SessionService)
    const testUser = { id: '1', username: 'test@example.com' }

    // Act
    await sessionService.login('test@example.com', 'password')

    // Assert
    expect(sessionService.currentUser.getValue()).toEqual(testUser)
  })
})
```

### Descriptive Test Names

- Use clear, descriptive test names that explain what is being tested
- Follow the "should [expected behavior] when [condition]" pattern
- Group related tests in `describe` blocks

```typescript
// ✅ Good - descriptive test names
describe('UserService', () => {
  describe('when user is authenticated', () => {
    it('should return user profile', async () => {
      // Test implementation
    })

    it('should allow updating user preferences', async () => {
      // Test implementation
    })
  })

  describe('when user is not authenticated', () => {
    it('should throw authentication error', async () => {
      // Test implementation
    })
  })
})

// ❌ Avoid - unclear test names
it('test 1', () => {})
it('works', () => {})
it('user', () => {})
```

## Vitest Mocking Patterns

### Minimal Mocking

**Keep mocking to the bare minimum.** Only mock what is necessary for the test to run in isolation and verify its specific behavior.

**Recommendation:** Avoid over-mocking. Prefer testing with real implementations when feasible.

### Hoisted Mock Definitions

When using `vi.mock()`, define the mock implementations for specific functions using `vi.fn()` within a `vi.hoisted()` callback at the top of the test file.

**Recommendation:** Place hoisted mocks before any imports from the modules they are mocking.

```typescript
// ✅ Good - hoist the mocks at the top
import { describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockSaveUser = vi.hoisted(() => vi.fn())

vi.mock('./user-api-client', () => ({
  UserApiClient: class {
    getUser = mockGetUser
    saveUser = mockSaveUser
  },
}))

// ... rest of the test file (imports, describe blocks, etc.)

describe('UserService', () => {
  it('should fetch user data', async () => {
    mockGetUser.mockResolvedValue({ id: '1', name: 'Test User' })

    const userService = injector.getInstance(UserService)
    const user = await userService.getUser('1')

    expect(user.name).toBe('Test User')
    expect(mockGetUser).toHaveBeenCalledWith('1')
  })
})
```

### Type-Safe Mocking

**CRITICAL:** Always add proper types to mock data and callbacks to avoid `any` type errors.

```typescript
// ✅ Good - properly typed mock callbacks
const mockUpload = vi.hoisted(() => vi.fn())

// In test
const uploadCallbacks = mockUpload.mock.calls[0][1] as {
  onSuccess: () => void
  onError: () => void
}
uploadCallbacks.onSuccess() // Type-safe

// ✅ Good - properly typed mock parameters
const uploadCall = mockUpload.mock.calls[0][0] as {
  fileId: string
  file: File
}
expect(uploadCall.fileId).toBe('file-123')

// ❌ Avoid - untyped mock access (causes linter errors)
const uploadCallbacks = mockUpload.mock.calls[0][1] // any type
uploadCallbacks.onSuccess() // Unsafe call of any
```

### Mocking Observables

When mocking services that return Observables, return `ObservableValue` instances:

```typescript
// ✅ Good - mocking Observable returns
import { ObservableValue } from '@furystack/utils'

const mockUserService = {
  currentUser: new ObservableValue({ id: '1', name: 'Test User' }),
  getUserById: vi.fn((id: string) => new ObservableValue({ id, name: 'Test User' })),
}

vi.mock('../services/user-service', () => ({
  UserService: vi.fn(() => mockUserService),
}))
```

### Mocking Cache

When mocking FuryStack Cache instances:

```typescript
// ✅ Good - mocking Cache
import { ObservableValue } from '@furystack/utils'

const mockUserCache = {
  get: vi.fn(async (id: string) => ({ id, name: 'Test User' })),
  getObservable: vi.fn((id: string) => new ObservableValue({ id, name: 'Test User' })),
  setExplicitValue: vi.fn(),
}

@Injectable({ lifetime: 'singleton' })
class MockUserService {
  public userCache = mockUserCache
}
```

## Playwright E2E Testing

### Locator Strategy (Priority Order)

1. **Semantic first**: `page.getByRole('button', { name: 'Login' })`
2. **Content-based**: `page.getByText('Username')`
3. **Form elements**: `page.locator('input[name="username"]')`
4. **Component-specific**: `page.locator('shade-login form')`
5. **Style-based (last resort)**: `page.locator('[style*="border-radius: 50%"]')`

### Helper Function Pattern

Create reusable helper functions for common workflows:

```typescript
// ✅ Good - helper function with verification
export const login = async (page: Page, username = 'testuser@gmail.com', password = 'password') => {
  const loginForm = page.locator('shade-login form')
  await loginForm.locator('input[name="userName"]').fill(username)
  await loginForm.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()

  // Helper handles verification internally
  await expect(page.locator('shade-noty', { hasText: 'Welcome back' })).toBeVisible()
  const firstLetter = username.charAt(0).toUpperCase()
  await expect(page.getByText(firstLetter).first()).toBeVisible()
}

export const logout = async (page: Page) => {
  // Handle complete logout workflow
  const userAvatar = page.locator('[style*="border-radius: 50%"][style*="cursor: pointer"]')
  await userAvatar.click()

  const logoutButton = page.getByRole('button', { name: /log out/i })
  await logoutButton.click()

  // Verify logout success
  await expect(page.locator('shade-login form')).toBeVisible()
}
```

### E2E Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { login, logout } from './helpers/auth-helpers'

test.describe('User Settings', () => {
  test('should update user profile', async ({ page }) => {
    // Setup
    await page.goto('/')
    await login(page)

    // Action
    await page.goto('/settings')
    await page.locator('input[name="displayName"]').fill('New Name')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verification
    await expect(page.locator('shade-noty', { hasText: 'Profile updated' })).toBeVisible()
  })
})
```

### Critical E2E Testing Rules

#### ✅ Test What EXISTS

```typescript
// Good - test actual behavior
const form = page.locator('form[data-form-id]')
await form.locator('input[name="username"]').fill('test')
await expect(form.locator('input[name="username"]')).toHaveValue('test')
```

#### ❌ Don't Test Assumptions

```typescript
// Bad - assuming validation that doesn't exist
const errorMessage = page.locator('div', { hasText: 'Password too short' })
await expect(errorMessage).toBeVisible() // This might not exist!
```

### Dynamic Content Handling

```typescript
// Handle dynamic test data
const testEmail = `user-${Date.now()}@example.com`
const firstLetter = testEmail.charAt(0).toUpperCase()

// Use in tests
await usernameInput.fill(testEmail)
// Later verify avatar shows correct letter
await expect(page.getByText(firstLetter).first()).toBeVisible()
```

### Error Testing

```typescript
// Test general error handling, not specific messages
await submitInvalidForm()

// Look for ANY error notification, not specific text
const errorNoty = page.locator('shade-noty').first()
await expect(errorNoty).toBeVisible()
```

### User Journey Test Pattern

E2E tests should follow user journeys, not component isolation. Each test should simulate a complete user workflow from start to finish.

**Structure:**

- One test per complete user workflow
- Test from login to logical endpoint
- Clean up any created/modified data at the end
- Use helper functions for reusable steps within the test file

**Good Example - User Journey:**

```typescript
test('Admin can navigate to users, edit roles, and verify persistence', async ({ page }) => {
  // 1. Login as admin
  await login(page)

  // 2. Navigate to app settings, verify Users menu
  await navigateToAppSettings(page)
  await expect(page.getByText('Users')).toBeVisible()

  // 3. Click Users, verify table structure
  await page.getByText('Users').click()
  await verifyUsersTableStructure(page)

  // 4. Open user, record initial state
  const initialRoleCount = await page.locator('role-tag').count()

  // 5. Make changes (add a role)
  await addRoleToUser(page)
  await page.getByRole('button', { name: 'Save' }).click()

  // 6. Reload and verify persistence
  await page.reload()
  await expect(page.locator('role-tag')).toHaveCount(initialRoleCount + 1)

  // 7. Cleanup - restore original state
  await removeRoleFromUser(page)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('role-tag')).toHaveCount(initialRoleCount)
})
```

**Bad Example - Fragmented Tests:**

```typescript
// ❌ Don't split into many small tests - causes repeated setup and state issues
test.describe('User Management', () => {
  test('should display Users menu', ...)
  test('should navigate to users list', ...)
  test('should display table headers', ...)
  test('should display at least one user', ...)
  test('should open user details', ...)
  test('should add a role', ...)
  test('should save changes', ...)
})
```

**Cleanup Pattern:**

```typescript
test('User can create, customize, and delete a resource', async ({ page }) => {
  await login(page)

  // Record initial state if needed
  const initialCount = await page.locator('.resource').count()

  // Create resource (use unique identifier)
  const resourceName = `test-${Date.now()}`
  await createResource(page, resourceName)

  // Perform actions and verifications
  await customizeResource(page, resourceName)
  await verifyResource(page, resourceName)

  // Cleanup - restore original state
  await deleteResource(page, resourceName)
  await expect(page.locator('.resource')).toHaveCount(initialCount)
})
```

**Key Principles:**

- Tests are self-contained and don't depend on other tests
- Tests clean up after themselves to avoid state accumulation
- Use unique identifiers (timestamps, UUIDs) for test data
- Helper functions should be local to the test file unless truly reusable across multiple test files

## Unit Testing Best Practices

### Component Testing

Test component behavior, not implementation:

```typescript
// ✅ Good - testing behavior
describe('UserProfileComponent', () => {
  it('should display user information', () => {
    const props = { user: { id: '1', name: 'Test User', email: 'test@example.com' } }
    const component = createComponent(UserProfile, props)

    expect(component.textContent).toContain('Test User')
    expect(component.textContent).toContain('test@example.com')
  })

  it('should call onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn()
    const props = { user: { id: '1', name: 'Test' }, onEdit: mockOnEdit }
    const component = createComponent(UserProfile, props)

    const editButton = component.querySelector('button')
    editButton?.click()

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })
})
```

### Service Testing

Test service methods and state management:

```typescript
// ✅ Good - service testing
import { Injector } from '@furystack/inject'
import { describe, expect, it, vi } from 'vitest'

describe('UserService', () => {
  it('should update current user on successful login', async () => {
    const injector = new Injector()
    const userService = injector.getInstance(UserService)

    await userService.login('test@example.com', 'password')

    const currentUser = userService.currentUser.getValue()
    expect(currentUser).toBeTruthy()
    expect(currentUser?.email).toBe('test@example.com')
  })

  it('should clear current user on logout', async () => {
    const injector = new Injector()
    const userService = injector.getInstance(UserService)

    await userService.login('test@example.com', 'password')
    await userService.logout()

    expect(userService.currentUser.getValue()).toBeNull()
  })
})
```

### Error Scenario Testing

**CRITICAL:** All service and component tests MUST include error scenario coverage in addition to happy path tests.

#### Required Error Scenarios

For every service method, test:

1. **API/Network Errors** - Server failures, timeouts, network disconnects
2. **Validation Errors** - Invalid input data (400 responses)
3. **Authentication Errors** - Unauthorized access (401 responses)
4. **Not Found Errors** - Missing resources (404 responses)
5. **Conflict Errors** - Duplicate resources (409 responses)
6. **Server Errors** - Internal failures (500 responses)

#### Service Error Testing Pattern

```typescript
// ✅ Good - testing error scenarios
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { RequestError } from '@furystack/rest-service'
import { describe, expect, it, vi } from 'vitest'

describe('DashboardService', () => {
  describe('getDashboard', () => {
    it('should fetch a dashboard by id', async () => {
      // Happy path test
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboard })
      // ... test implementation
    })

    it('should throw RequestError when API returns 404', async () => {
      const mockCall = vi.fn().mockRejectedValue(new RequestError('Dashboard not found', 404))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await expect(service.getDashboard('invalid-id')).rejects.toThrow('Dashboard not found')
      })
    })

    it('should handle network errors', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Network error'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await expect(service.getDashboard('dashboard-1')).rejects.toThrow('Network error')
      })
    })

    it('should handle server errors', async () => {
      const mockCall = vi.fn().mockRejectedValue(new RequestError('Internal server error', 500))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await expect(service.getDashboard('dashboard-1')).rejects.toThrow('Internal server error')
      })
    })
  })

  describe('createDashboard', () => {
    it('should throw validation error for invalid data', async () => {
      const mockCall = vi.fn().mockRejectedValue(new RequestError('Invalid dashboard data', 400))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await expect(service.createDashboard({ name: '', owner: '', description: '', widgets: [] })).rejects.toThrow(
          'Invalid dashboard data',
        )
      })
    })

    it('should throw conflict error when dashboard already exists', async () => {
      const mockCall = vi.fn().mockRejectedValue(new RequestError('Dashboard already exists', 409))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await expect(
          service.createDashboard({ name: 'Existing', owner: 'user', description: '', widgets: [] }),
        ).rejects.toThrow('Dashboard already exists')
      })
    })
  })
})

// ❌ Avoid - only testing happy paths
describe('DashboardService', () => {
  it('should fetch a dashboard by id', async () => {
    // Only happy path, missing error scenarios
  })
})
```

#### Cache Error State Testing

When testing services with Cache, verify error states are properly handled:

```typescript
// ✅ Good - testing cache error states
describe('MovieService', () => {
  it('should handle cache load errors', async () => {
    const mockCall = vi.fn().mockRejectedValue(new Error('API unavailable'))
    const injector = createTestInjector(mockCall)

    await usingAsync(injector, async (i) => {
      const service = i.getInstance(MovieService)

      // First call should fail
      await expect(service.getMovie('tt1234567')).rejects.toThrow('API unavailable')

      // Verify cache doesn't store failed result
      mockCall.mockResolvedValue({ result: createMockMovie() })
      const movie = await service.getMovie('tt1234567')
      expect(movie).toBeDefined()
    })
  })
})
```

#### Cache Invalidation Testing

Verify that cache invalidation actually causes fresh data to be fetched:

```typescript
// ✅ Good - verifying cache invalidation
describe('DashboardService', () => {
  it('should fetch fresh data after cache invalidation', async () => {
    const originalDashboard = createMockDashboard('dashboard-1', 'Original')
    const updatedDashboard = createMockDashboard('dashboard-1', 'Updated')

    const mockCall = vi
      .fn()
      .mockResolvedValueOnce({ result: originalDashboard })
      .mockResolvedValueOnce({ result: updatedDashboard })
      .mockResolvedValueOnce({ result: updatedDashboard })

    const injector = createTestInjector(mockCall)

    await usingAsync(injector, async (i) => {
      const service = i.getInstance(DashboardService)

      // Load initial data (API call #1)
      const initial = await service.getDashboard('dashboard-1')
      expect(initial.name).toBe('Original')

      // Update dashboard (API call #2, invalidates cache)
      await service.updateDashboard('dashboard-1', {
        name: 'Updated',
        owner: 'user',
        description: '',
        widgets: [],
      })

      // Fetch again should get fresh data (API call #3 due to invalidation)
      const fresh = await service.getDashboard('dashboard-1')
      expect(fresh.name).toBe('Updated')
      expect(mockCall).toHaveBeenCalledTimes(3)
    })
  })
})

// ❌ Avoid - not verifying cache invalidation
it('should update a dashboard', async () => {
  await service.updateDashboard('dashboard-1', updates)
  // Missing: verify that subsequent getDashboard calls fetch fresh data
})
```

#### Observable Error State Testing

Test that Observables properly reflect error states:

```typescript
// ✅ Good - testing Observable error states
describe('DataService', () => {
  it('should set error state when load fails', async () => {
    const mockCall = vi.fn().mockRejectedValue(new Error('Load failed'))
    const injector = createTestInjector(mockCall)

    await usingAsync(injector, async (i) => {
      const service = i.getInstance(DataService)
      const observable = service.getDataAsObservable('data-1')

      // Track state changes
      const states: string[] = []
      observable.subscribe((state) => states.push(state.status))

      // Trigger load
      try {
        await service.getData('data-1')
      } catch (error) {
        // Expected to fail
      }

      // Verify error state transition
      expect(states).toContain('error')
      const currentState = observable.getValue()
      expect(currentState.status).toBe('error')
      if (currentState.status === 'error') {
        expect(currentState.error).toBe('Load failed')
      }
    })
  })
})
```

#### Component Error Handling

Test that components handle and display errors appropriately:

```typescript
// ✅ Good - testing component error handling
describe('DashboardEditor', () => {
  it('should display error message when save fails', async () => {
    const mockService = {
      updateDashboard: vi.fn().mockRejectedValue(new Error('Save failed'))
    }

    const injector = new Injector()
    injector.setExplicitInstance(mockService, DashboardService)

    const rootElement = document.getElementById('root') as HTMLDivElement
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <DashboardEditor dashboardId="dashboard-1" />
    })

    // Trigger save
    const saveButton = rootElement.querySelector('button[type="submit"]') as HTMLButtonElement
    saveButton.click()

    // Wait for error to be displayed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify error display
    const errorMessage = rootElement.textContent
    expect(errorMessage).toContain('Save failed')
  })

  it('should handle loading state during async operations', async () => {
    const mockService = {
      getDashboard: vi.fn(() => new Promise(resolve => setTimeout(() => resolve(mockDashboard), 100)))
    }

    const injector = new Injector()
    injector.setExplicitInstance(mockService, DashboardService)

    const rootElement = document.getElementById('root') as HTMLDivElement
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <DashboardEditor dashboardId="dashboard-1" />
    })

    // Verify loading state is shown
    expect(rootElement.textContent).toContain('Loading')

    // Wait for load to complete
    await new Promise(resolve => setTimeout(resolve, 150))

    // Verify content is displayed
    expect(rootElement.textContent).not.toContain('Loading')
  })
})
```

#### Error Testing Checklist

For each service method, ensure you have tests for:

- [ ] Happy path (successful operation)
- [ ] Network/API errors
- [ ] Validation errors (400)
- [ ] Authentication errors (401) if applicable
- [ ] Not found errors (404)
- [ ] Conflict errors (409) if applicable
- [ ] Server errors (500)
- [ ] Cache invalidation (for update/delete operations)
- [ ] Observable error states (for methods returning observables)

### Testing Observable State

```typescript
// ✅ Good - testing Observable state changes
import { ObservableValue } from '@furystack/utils'

describe('DataService', () => {
  it('should update observable when data is loaded', async () => {
    const dataService = injector.getInstance(DataService)
    const states: string[] = []

    // Subscribe to state changes
    dataService.loadingState.subscribe((state) => {
      states.push(state.status)
    })

    // Trigger data load
    await dataService.loadData()

    // Verify state transitions
    expect(states).toEqual(['idle', 'loading', 'loaded'])
  })
})
```

### Handling Async Operations in Tests

**CRITICAL:** Always await async operations in service methods that are called during tests to prevent unhandled rejections.

#### The Problem: Unhandled Rejections

When async operations (like cache reloads) are triggered with `void` or not awaited, they may continue running after the test completes and the injector is disposed, causing "Injector already disposed" errors.

#### Service Method Guidelines

```typescript
// ❌ AVOID - Fire-and-forget async in methods called by tests
public updateDevice = async (name: string, body: DeviceUpdate) => {
  await this.apiClient.call({
    method: 'PATCH',
    action: '/devices/:id',
    url: { id: name },
    body,
  })

  void this.deviceCache.reload(name) // ❌ Will cause unhandled rejection in tests
  this.deviceQueryCache.flushAll()
}

// ✅ GOOD - Await async operations
public updateDevice = async (name: string, body: DeviceUpdate) => {
  await this.apiClient.call({
    method: 'PATCH',
    action: '/devices/:id',
    url: { id: name },
    body,
  })

  await this.deviceCache.reload(name) // ✅ Properly awaited
  this.deviceQueryCache.flushAll()
}
```

#### Event Handlers and Callbacks

For event handlers and callbacks where you cannot await (e.g., WebSocket listeners), add explicit error handling:

```typescript
// ✅ GOOD - Error handling in event listeners
public init() {
  this.websocketService.addListener('onMessage', (message) => {
    if (message.type === 'device-connected') {
      // Fire-and-forget is acceptable here with error handling
      void this.deviceCache.reload(message.device.name).catch((error) => {
        // Log error but don't throw (listener context)
        console.error('Failed to reload device cache:', error)
      })
    }
  })
}

// ❌ AVOID - No error handling
public init() {
  this.websocketService.addListener('onMessage', (message) => {
    if (message.type === 'device-connected') {
      void this.deviceCache.reload(message.device.name) // ❌ Unhandled rejection
    }
  })
}
```

#### Test Setup with usingAsync

Always use `usingAsync` to ensure proper cleanup:

```typescript
// ✅ GOOD - Proper injector lifecycle management
import { usingAsync } from '@furystack/utils'

describe('DeviceService', () => {
  it('should update device and reload cache', async () => {
    const mockDevice = createMockDevice()
    const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
    const injector = createTestInjector(mockCall)

    await usingAsync(injector, async (i) => {
      const service = i.getInstance(DeviceService)

      // This will properly await the cache reload
      await service.updateDevice('device-1', { ipAddress: '192.168.1.100' })

      // Verify the reload happened
      expect(mockCall).toHaveBeenCalledTimes(2) // PATCH + reload GET
    })
    // Injector is disposed here, after all async operations complete
  })
})

// ❌ AVOID - Manual injector disposal without awaiting
describe('DeviceService', () => {
  it('should update device', async () => {
    const injector = new Injector()
    const service = injector.getInstance(DeviceService)

    await service.updateDevice('device-1', { ipAddress: '192.168.1.100' })

    injector.dispose() // ❌ May dispose while cache reload is still pending
  })
})
```

#### Mock Response Requirements

When mocking API calls that trigger cache reloads, ensure mocks return appropriate responses:

```typescript
// ✅ GOOD - Mock returns proper response for reload
it('should reload device cache after update', async () => {
  const mockDevice = createMockDevice()
  // Mock will be called twice: once for PATCH, once for reload GET
  const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
  const injector = createTestInjector(mockCall)

  await usingAsync(injector, async (i) => {
    const service = i.getInstance(DeviceService)
    await service.updateDevice('device-1', { ipAddress: '192.168.1.100' })

    expect(mockCall).toHaveBeenCalledTimes(2)
  })
})

// ❌ AVOID - Mock doesn't handle reload call
it('should update device', async () => {
  const mockCall = vi.fn().mockResolvedValue({}) // ❌ Empty response fails reload
  const injector = createTestInjector(mockCall)

  await usingAsync(injector, async (i) => {
    const service = i.getInstance(DeviceService)
    await service.updateDevice('device-1', { ipAddress: '192.168.1.100' })
    // Test may pass but leaves pending rejection
  })
})
```

#### Async Operation Checklist

Before merging code with async operations:

- [ ] All async operations in public service methods are properly awaited
- [ ] Event handlers with fire-and-forget async have `.catch()` error handling
- [ ] Tests use `usingAsync` for injector lifecycle management
- [ ] Mock API responses handle all expected calls (including cache reloads)
- [ ] No `void void` double-void patterns (typos)
- [ ] Test suite shows "No unhandled errors" when running

#### Common Patterns to Fix

```typescript
// Pattern 1: Cache reload in CRUD operations
// ❌ AVOID
public updateEntity = async (id: string, data: Entity) => {
  await this.api.update(id, data)
  void this.cache.reload(id) // Fix: await this.cache.reload(id)
}

// Pattern 2: Multiple async operations
// ❌ AVOID
public deleteEntity = async (id: string) => {
  await this.api.delete(id)
  this.cache.remove(id) // Sync, OK
  this.queryCache.flushAll() // Sync, OK
  void this.relatedCache.reload() // Fix: await this.relatedCache.reload()
}

// Pattern 3: Observable subscriptions in event handlers
// ❌ AVOID
this.events.on('update', (id) => {
  void this.cache.reload(id) // Fix: add .catch()
})

// ✅ GOOD
this.events.on('update', (id) => {
  void this.cache.reload(id).catch(console.error)
})
```

## Backend Action Testing

### Testing REST Actions

Test backend actions with proper mocking of injector dependencies:

```typescript
// ✅ Good - backend action unit test
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { describe, expect, it, vi } from 'vitest'
import { RegisterAction } from './register-action.js'

describe('RegisterAction', () => {
  const createTestInjector = () => {
    const injector = new Injector()

    // Mock store manager
    const mockUserStore = {
      get: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    }

    const mockCredentialStore = {
      add: vi.fn(),
    }

    injector.setExplicitInstance(
      {
        getStoreFor: vi.fn((model) => {
          if (model.name === 'User') return mockUserStore
          if (model.name === 'PasswordCredential') return mockCredentialStore
          throw new Error(`Unknown model: ${model.name}`)
        }),
      } as unknown as StoreManager,
      StoreManager,
    )

    return { injector, mockUserStore, mockCredentialStore }
  }

  it('should create a new user when username does not exist', async () => {
    const { injector, mockUserStore, mockCredentialStore } = createTestInjector()

    mockUserStore.get.mockResolvedValue(null) // User doesn't exist
    mockUserStore.add.mockResolvedValue({ username: 'test@example.com', roles: [] })
    mockCredentialStore.add.mockResolvedValue({})

    const result = await RegisterAction({
      injector,
      getBody: async () => ({ username: 'test@example.com', password: 'password123' }),
      response: {} as Response,
      request: {} as Request,
    })

    expect(mockUserStore.add).toHaveBeenCalledWith(expect.objectContaining({ username: 'test@example.com' }))
  })

  it('should throw 409 when user already exists', async () => {
    const { injector, mockUserStore } = createTestInjector()

    mockUserStore.get.mockResolvedValue({ username: 'existing@example.com' })

    await expect(
      RegisterAction({
        injector,
        getBody: async () => ({ username: 'existing@example.com', password: 'password123' }),
        response: {} as Response,
        request: {} as Request,
      }),
    ).rejects.toThrow('User already exists')
  })
})
```

### Action Test Patterns

When testing backend actions:

1. **Mock StoreManager** - Provide mock stores for each entity type
2. **Mock Authentication** - Use `HttpUserContext` for authenticated actions
3. **Test error cases** - Verify proper RequestError codes (400, 401, 404, 409, 500)
4. **Test cleanup logic** - Verify partial state is cleaned up on failure

```typescript
// ✅ Good - testing authenticated action
import { getCurrentUser } from '@furystack/core'

vi.mock('@furystack/core', () => ({
  getCurrentUser: vi.fn(),
}))

describe('PasswordResetAction', () => {
  it('should throw 401 when user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    await expect(PasswordResetAction({ injector, getBody: async () => ({}) })).rejects.toThrow('User not authenticated')
  })

  it('should throw 400 when current password is incorrect', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ username: 'test@example.com' })
    mockAuthenticator.setPasswordForUser.mockRejectedValue(new UnauthenticatedError())

    await expect(
      PasswordResetAction({
        injector,
        getBody: async () => ({ currentPassword: 'wrong', newPassword: 'new123' }),
      }),
    ).rejects.toThrow('Current password is incorrect')
  })
})
```

### RequestError Testing

Test that actions throw appropriate HTTP error codes:

```typescript
// ✅ Good - testing RequestError codes
import { RequestError } from '@furystack/rest'

it('should throw 409 for duplicate resource', async () => {
  // Setup duplicate condition
  mockStore.find.mockResolvedValue({ count: 1 })

  try {
    await CreateResourceAction({ injector, getBody: async () => ({}) })
    fail('Expected RequestError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(RequestError)
    expect((error as RequestError).responseCode).toBe(409)
  }
})

it('should throw 400 for validation errors', async () => {
  try {
    await CreateResourceAction({
      injector,
      getBody: async () => ({ invalidField: true }),
    })
    fail('Expected RequestError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(RequestError)
    expect((error as RequestError).responseCode).toBe(400)
  }
})
```

## Test Organization

### Co-location

- Keep tests close to the code they test
- Use descriptive test file names
- Group related tests logically

```
frontend/src/services/
├── user-service.ts
├── user-service.spec.ts
└── session-service.ts
    └── session-service.spec.ts

e2e/
├── login.e2e.spec.ts
├── registration.e2e.spec.ts
└── helpers/
    ├── auth-helpers.ts
    └── navigation-helpers.ts
```

### Test Categories

- **Unit tests**: Test individual functions, services, utilities
- **Component tests**: Test Shades components in isolation
- **Integration tests**: Test service interactions
- **E2E tests**: Test complete user workflows with Playwright

## Test Maintenance

### Helper Centralization

Create helpers that encapsulate:

- Complex component interactions (dropdown menus, modals)
- Multi-step workflows (login, logout, navigation)
- Assertion patterns (notification handling, error states)
- Setup/teardown operations (test data creation, cleanup)

### Avoid Brittleness

- Use semantic locators over CSS selectors
- Handle dynamic content appropriately
- Test user workflows, not implementation details
- Keep tests independent and parallelizable
- Don't rely on test execution order

### Skip Unimplemented Features

```typescript
test.skip('Future Feature', async ({ page }) => {
  // Mark unimplemented features for later
})
```

This prevents test failures on functionality that doesn't exist yet while maintaining a plan for future testing.

## Running Tests

### Test Scripts

```bash
# Unit tests
yarn test:unit

# E2E tests
yarn test:e2e

# E2E installation test (run once)
yarn test:e2e:install

# Watch mode (unit tests)
vitest
```

## Summary

**Key Principles:**

1. **Error scenarios first** - Test both happy paths AND error cases (CRITICAL)
2. **Minimal mocking** - Only mock what's necessary
3. **Type-safe mocks** - Always type mock callbacks and data
4. **Arrange-Act-Assert** - Follow clear test structure
5. **Semantic locators** - Use accessible queries in E2E tests
6. **Helper functions** - Encapsulate common workflows
7. **Test behavior** - Not implementation details
8. **Co-locate tests** - Keep tests near the code they test
9. **Descriptive names** - Make test names clear and specific
10. **Hoisted mocks** - Define mocks at the top of test files
11. **Independent tests** - Each test should run in isolation
12. **Verify side effects** - Test cache invalidation, WebSocket listeners, cleanup

**Testing Checklist:**

- [ ] Tests use Arrange-Act-Assert pattern
- [ ] Mocks are hoisted and properly typed
- [ ] E2E tests use semantic locators
- [ ] Helper functions for common workflows
- [ ] Tests are independent and parallelizable
- [ ] Observable state changes are tested
- [ ] **Error scenarios are covered (CRITICAL)**
  - [ ] API/Network errors tested
  - [ ] Validation errors tested (400)
  - [ ] Authentication errors tested (401) if applicable
  - [ ] Not found errors tested (404)
  - [ ] Conflict errors tested (409) if applicable
  - [ ] Server errors tested (500)
  - [ ] Cache invalidation verified
  - [ ] Observable error states tested
- [ ] No brittle CSS selectors

**Tools:**

- Unit/Integration: `vitest`
- E2E: `@playwright/test`
- Test Runner: `yarn test:unit` or `yarn test:e2e`
