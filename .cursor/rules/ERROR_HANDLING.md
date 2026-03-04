# Error Handling Guidelines

## RequestError Usage

### HTTP Error Codes

Use proper HTTP status codes with `RequestError` from `@furystack/rest-service`:

- `409` - Resource already exists (conflict)
- `400` - Validation errors, bad request
- `401` - Authentication required
- `403` - Forbidden, insufficient permissions
- `404` - Resource not found
- `500` - Internal server error

```typescript
// ✅ Good - proper RequestError usage
import { RequestError, JsonResult, type RequestAction } from '@furystack/rest-service'
import { getLogger } from '@furystack/logging'

export const CreateUserAction: RequestAction<typeof CreateUserApiEndpoint> = async ({ injector, getBody }) => {
  const logger = getLogger(injector).withScope('CreateUserAction')
  const body = await getBody()

  try {
    // Check if user already exists
    const existingUser = await store.find({ filter: { email: { $eq: body.email } } })
    if (existingUser.count > 0) {
      throw new RequestError('User with this email already exists', 409)
    }

    // Validate input
    if (!body.email || !body.password) {
      throw new RequestError('Email and password are required', 400)
    }

    // Create user
    const user = await store.add(body)
    return JsonResult(user)
  } catch (error) {
    if (error instanceof RequestError) {
      throw error
    }
    await logger.error({ message: 'Failed to create user', data: { error } })
    throw new RequestError('Failed to create user', 500)
  }
}
```

### Error Logging

Always log errors with context information:

```typescript
// ✅ Good - error logging with context
import { getLogger } from '@furystack/logging'

export const UpdateUserAction: RequestAction<typeof UpdateUserApiEndpoint> = async ({ injector, getBody }) => {
  const logger = getLogger(injector).withScope('UpdateUserAction')

  try {
    const body = await getBody()
    const result = await updateUser(body)
    return JsonResult(result)
  } catch (error) {
    await logger.error({
      message: 'Failed to update user',
      data: {
        userId: body.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
    throw new RequestError('Failed to update user. Please try again.', 500)
  }
}
```

## Observable Error States

### Error State Patterns

Use `ObservableValue` for error states in services and components:

```typescript
// ✅ Good - Observable error state
import { ObservableValue } from '@furystack/utils'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class UserService {
  public error = new ObservableValue<string>('')
  public isLoading = new ObservableValue(false)

  public async loadUsers() {
    this.isLoading.setValue(true)
    this.error.setValue('')

    try {
      const users = await this.apiClient.getUsers()
      this.users.setValue(users)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      this.error.setValue(message)
    } finally {
      this.isLoading.setValue(false)
    }
  }
}
```

### Component Error Handling

Display user-friendly error messages in components:

```typescript
// ✅ Good - component error handling
export const UserList = Shade({
  shadowDomName: 'user-list',
  render: ({ injector, useObservable }) => {
    const userService = injector.getInstance(UserService);
    const [error] = useObservable('error', userService.error);
    const [isLoading] = useObservable('loading', userService.isLoading);
    const [users] = useObservable('users', userService.users);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return (
        <div style={{ color: 'red', padding: '16px' }}>
          <strong>Error:</strong> {error}
          <button onclick={() => userService.loadUsers()}>Retry</button>
        </div>
      );
    }

    return (
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    );
  },
});
```

## Cache Error Handling

> **Note:** For detailed cache patterns (load functions, `getObservable` error states, capacity), see [CACHE_HANDLING.md](./CACHE_HANDLING.md). This section covers the error-handling aspects only.

## Form Error Handling

### Validation Errors

Handle form validation errors with clear user feedback:

```typescript
// ✅ Good - form validation with error display
export const RegistrationForm = Shade({
  shadowDomName: 'registration-form',
  render: ({ injector, useDisposable }) => {
    const authService = injector.getInstance(AuthService);
    const error = useDisposable('error', () => new ObservableValue(''));
    const isLoading = useDisposable('loading', () => new ObservableValue(false));

    const handleSubmit = async (ev: Event) => {
      ev.preventDefault();
      const form = ev.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Client-side validation
      if (password !== confirmPassword) {
        error.setValue('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        error.setValue('Password must be at least 8 characters');
        return;
      }

      isLoading.setValue(true);
      error.setValue('');

      try {
        await authService.register(email, password);
        // Success - redirect or show success message
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        error.setValue(message);
      } finally {
        isLoading.setValue(false);
      }
    };

    return (
      <form onsubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" required />

        {error.getValue() && (
          <div style={{ color: 'red', padding: '8px' }}>
            {error.getValue()}
          </div>
        )}

        <button type="submit" disabled={isLoading.getValue()}>
          {isLoading.getValue() ? 'Registering...' : 'Register'}
        </button>
      </form>
    );
  },
});
```

## User-Friendly Error Messages

### Error Message Utilities

Create utility functions for user-friendly error messages:

```typescript
// ✅ Good - error message utility
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof RequestError) {
    // Return the user-friendly message from RequestError
    return error.message
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.'
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You do not have permission to perform this action.'
    }

    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource was not found.'
    }

    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.'
    }

    // Return the error message if it's user-friendly
    return error.message
  }

  // Default error message
  return 'Something went wrong. Please try again.'
}
```

### Using Error Utility in Components

```typescript
// ✅ Good - using error utility
export const DataDisplay = Shade({
  shadowDomName: 'data-display',
  render: ({ injector, useObservable, useDisposable }) => {
    const dataService = injector.getInstance(DataService);
    const [data] = useObservable('data', dataService.data);
    const error = useDisposable('error', () => new ObservableValue(''));

    const loadData = async () => {
      try {
        await dataService.loadData();
      } catch (err) {
        error.setValue(getUserFriendlyErrorMessage(err));
      }
    };

    if (error.getValue()) {
      return (
        <div style={{ color: 'red' }}>
          {error.getValue()}
          <button onclick={() => void loadData()}>Retry</button>
        </div>
      );
    }

    return <div>{/* Display data */}</div>;
  },
});
```

## Error Recovery Patterns

### Retry Logic

Implement retry logic with exponential backoff:

```typescript
// ✅ Good - retry with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        // Calculate exponential backoff: 1s, 2s, 4s, 8s (max 30s)
        const delay = Math.min(initialDelay * 2 ** attempt, 30000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Usage
@Injectable({ lifetime: 'singleton' })
export class DataService {
  public async loadCriticalData() {
    return await retryWithBackoff(
      async () => {
        const { result } = await this.apiClient.call({
          method: 'GET',
          action: '/critical-data',
          query: {},
        })
        return result
      },
      3,
      1000,
    )
  }
}
```

### Graceful Degradation

Provide fallback content when errors occur:

```typescript
// ✅ Good - graceful degradation
export const UserAvatar = Shade<{ userId: string }>({
  shadowDomName: 'user-avatar',
  render: ({ props, injector, useObservable, useDisposable }) => {
    const userService = injector.getInstance(UserService);
    const hasError = useDisposable('hasError', () => new ObservableValue(false));

    const [userData] = useObservable('user', userService.getUserById(props.userId));

    // Gracefully handle missing data
    if (!userData || hasError.getValue()) {
      // Fallback: show initials or generic avatar
      return (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ?
        </div>
      );
    }

    return (
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#2196f3',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {userData.name.charAt(0).toUpperCase()}
      </div>
    );
  },
});
```

## Error Prevention

### Input Validation

Validate inputs early to prevent errors:

```typescript
// ✅ Good - early validation
export const UpdateUserAction: RequestAction<typeof UpdateUserApiEndpoint> = async ({ injector, getBody }) => {
  const body = await getBody()

  // Validate input format
  if (!body.id || typeof body.id !== 'string') {
    throw new RequestError('Invalid user ID', 400)
  }

  if (body.email && !isValidEmail(body.email)) {
    throw new RequestError('Invalid email format', 400)
  }

  if (body.age && (body.age < 0 || body.age > 150)) {
    throw new RequestError('Invalid age value', 400)
  }

  // Proceed with update
  const result = await updateUser(body)
  return JsonResult(result)
}
```

## Result Types Over Throwing for Expected Failures

### When to Use Discriminated Union Results

For operations where multiple **expected** outcomes exist (not just success/failure), return a discriminated union instead of throwing. Reserve `RequestError` / `throw` for truly unexpected situations or REST action validation.

**Use result types when:**

- The caller needs to distinguish between different failure modes (rate limit, not found, not configured, etc.)
- The operation is called in a loop or batch where throwing would abort the entire batch
- The failure is an expected business outcome, not a programming error

**Keep throwing when:**

- The error is a REST action validation failure (bad input, unauthorized, etc.)
- The error indicates a programming bug or data integrity issue
- The caller cannot reasonably recover

```typescript
// ✅ Good - discriminated union for expected outcomes
export type OperationResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'not-configured' }
  | { status: 'error'; error: unknown }

export const fetchMetadata = async (id: string): Promise<OperationResult<Metadata>> => {
  if (!config) {
    return { status: 'not-configured' }
  }
  // ... fetch logic with rate limit detection ...
  if (rateLimited) {
    return { status: 'rate-limited' }
  }
  return { status: 'success', data: result }
}

// ✅ Good - caller handles each status without try/catch
const result = await fetchMetadata(id)
if (result.status === 'rate-limited') {
  updateProgress(progress, 'rate-limited')
  continue
}
if (result.status === 'success') {
  await processData(result.data)
}

// ❌ Avoid - throwing for expected outcomes in batch operations
const fetchMetadata = async (id: string): Promise<Metadata> => {
  // Throwing here would abort the entire batch
  if (!config) throw new Error('Not configured')
  if (rateLimited) throw new RequestError('Rate limited', 429)
  if (!found) throw new RequestError('Not found', 404)
  return result
}
```

### Shared Status Mapping Utilities

When a result type is consumed in multiple places (e.g., progress tracking), define the mapping utility alongside the type to keep them in sync:

```typescript
// ✅ Good - utility lives next to the type, uses the actual union type
export type LinkMovieStatus = LinkMovie['result']['status']

export const updateScanProgress = (progress: ScanProgress, status: LinkMovieStatus | 'skipped' | 'failed') => {
  switch (status) {
    case 'linked':
      progress.linked++
      break
    case 'rate-limited':
      progress.rateLimited++
      break
    // ... all cases handled with type safety
    default:
      progress.skipped++
      break
  }
}

// ❌ Avoid - duplicated switch statements with `string` parameter
const updateProgress = (progress: ScanProgress, status: string) => {
  /* ... */
}
```

## Summary

**Key Principles:**

1. **Use RequestError** with proper HTTP status codes (409, 400, 401, 404, 500)
2. **Log errors** with context using `getLogger`
3. **Observable error states** for reactive error handling
4. **User-friendly messages** - no technical jargon
5. **Retry logic** with exponential backoff for transient failures
6. **Graceful degradation** - provide fallback content
7. **Early validation** to prevent errors
8. **Cache error handling** in load functions
9. **Form validation** with clear user feedback
10. **Error recovery** with retry mechanisms
11. **Result types** over throwing for expected failure modes in batch/loop operations
12. **Shared status mapping** utilities alongside the types they consume

**Error Handling Checklist:**

- [ ] All actions use proper RequestError codes
- [ ] Errors are logged with context
- [ ] Observable error states for async operations
- [ ] User-friendly error messages (no stack traces)
- [ ] Retry logic for transient failures
- [ ] Graceful degradation for missing data
- [ ] Input validation before processing
- [ ] Cache errors handled properly
- [ ] Form errors displayed clearly
- [ ] Expected failure modes return result types, not throw
- [ ] Status mapping utilities defined alongside types (not duplicated)

**Tools:**

- RequestError: `@furystack/rest-service`
- Logging: `@furystack/logging`
- Observable: `@furystack/utils/ObservableValue`
- Cache: `@furystack/cache`
