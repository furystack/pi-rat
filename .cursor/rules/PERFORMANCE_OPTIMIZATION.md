# Performance Optimization Guidelines

## Observable Subscription Optimization

### Minimize Subscriptions

Only subscribe to the observables you actually need:

```typescript
// ✅ Good - subscribe only to needed data
export const UserName = Shade<{ userId: string }>({
  shadowDomName: 'user-name',
  render: ({ props, injector, useObservable }) => {
    const userService = injector.getInstance(UserService);
    const [user] = useObservable('user', userService.getUserById(props.userId));

    // Only renders when user data changes
    return <span>{user?.name ?? 'Loading...'}</span>;
  },
});

// ❌ Avoid - subscribing to unnecessary data
export const UserName = Shade<{ userId: string }>({
  shadowDomName: 'user-name',
  render: ({ props, injector, useObservable }) => {
    const userService = injector.getInstance(UserService);
    const [allUsers] = useObservable('users', userService.allUsers); // Unnecessary
    const user = allUsers.find(u => u.id === props.userId);

    return <span>{user?.name ?? 'Loading...'}</span>;
  },
});
```

### Unsubscribe Automatically

Shades components automatically handle disposal of observables created with `useObservable` and `useDisposable`:

```typescript
// ✅ Good - automatic disposal
export const DataDisplay = Shade({
  shadowDomName: 'data-display',
  render: ({ injector, useObservable, useDisposable }) => {
    const dataService = injector.getInstance(DataService);

    // Automatically disposed when component unmounts
    const [data] = useObservable('data', dataService.data);
    const error = useDisposable('error', () => new ObservableValue(''));

    return <div>{data}</div>;
  },
});
```

## Disposal Patterns

### Using Disposable Pattern

Use `using` and `usingAsync` for automatic resource cleanup:

```typescript
// ✅ Good - using disposal pattern
@Injectable({ lifetime: 'singleton' })
export class DataService {
  public isLoading = new ObservableValue(false)

  private operation() {
    this.isLoading.setValue(true)
    return {
      [Symbol.dispose]: () => {
        this.isLoading.setValue(false)
      },
    }
  }

  public async loadData() {
    await usingAsync(this.operation(), async () => {
      // Loading state automatically managed
      const data = await this.fetchData()
      this.data.setValue(data)
    })
  }
}
```

### Resource Cleanup

Always clean up resources in services:

```typescript
// ✅ Good - proper resource cleanup
@Injectable({ lifetime: 'singleton' })
export class WebSocketService {
  private socket?: WebSocket
  private subscriptions = new Set<() => void>()

  public connect() {
    this.socket = new WebSocket('ws://example.com')
    // Setup socket
  }

  public [Symbol.dispose]() {
    this.socket?.close()
    this.subscriptions.forEach((unsub) => unsub())
    this.subscriptions.clear()
  }
}
```

## Lazy Loading

### Component Lazy Loading

Use dynamic imports for code splitting:

```typescript
// ✅ Good - lazy loaded component
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js';

export const settingsRoute = {
  url: '/settings',
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { SettingsPage } = await import('../pages/settings.js');
        return <SettingsPage />;
      }}
    />
  ),
} satisfies Route;
```

### Service Lazy Loading

Lazy load heavy dependencies:

```typescript
// ✅ Good - lazy loading heavy library
@Injectable({ lifetime: 'singleton' })
export class ChartService {
  private chartLib?: typeof import('chart.js')

  public async createChart(data: ChartData) {
    if (!this.chartLib) {
      this.chartLib = await import('chart.js')
    }
    return new this.chartLib.Chart(data)
  }
}
```

## Debouncing

### Input Debouncing

Debounce user input to reduce unnecessary operations:

```typescript
// ✅ Good - debounced search
export const SearchInput = Shade({
  shadowDomName: 'search-input',
  render: ({ injector, useDisposable }) => {
    const searchService = injector.getInstance(SearchService);
    const searchTerm = useDisposable('searchTerm', () => new ObservableValue(''));
    let debounceTimer: number | undefined;

    const handleInput = (ev: Event) => {
      const value = (ev.target as HTMLInputElement).value;
      searchTerm.setValue(value);

      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce search
      debounceTimer = window.setTimeout(() => {
        void searchService.search(value);
      }, 300);
    };

    return (
      <input
        type="search"
        placeholder="Search..."
        oninput={handleInput}
      />
    );
  },
});
```

### Debounce Utility

Create a reusable debounce utility:

```typescript
// ✅ Good - debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

// Usage
const debouncedSearch = debounce((term: string) => {
  searchService.search(term)
}, 300)
```

## Cache Optimization

> **Note:** For detailed cache patterns (capacity, load functions, `get`/`getObservable`/`setExplicitValue`, error handling), see [CACHE_HANDLING.md](./CACHE_HANDLING.md).

### Preload Critical Data

Preload data that will definitely be needed:

```typescript
// ✅ Good - preload critical data
@Injectable({ lifetime: 'singleton' })
export class AppInitService {
  @Injected(UserService)
  declare private userService: UserService

  @Injected(ConfigService)
  declare private configService: ConfigService

  public async initialize() {
    // Preload in parallel
    await Promise.all([this.userService.loadCurrentUser(), this.configService.loadConfig()])
  }
}
```

## Rendering Optimization

### Conditional Rendering

Avoid rendering unnecessary content:

```typescript
// ✅ Good - conditional rendering
export const UserProfile = Shade<{ userId: string }>({
  shadowDomName: 'user-profile',
  render: ({ props, injector, useObservable }) => {
    const userService = injector.getInstance(UserService);
    const [user] = useObservable('user', userService.getUserById(props.userId));

    // Early return for loading/error states
    if (!user) return <div>Loading...</div>;

    // Only render when data is available
    return (
      <div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        {/* Expensive components only rendered when needed */}
        {user.isAdmin && <AdminPanel />}
      </div>
    );
  },
});
```

### Virtual Scrolling

For large lists, consider virtual scrolling:

```typescript
// ✅ Good - virtual scrolling for large lists (100+ items)
export const LargeList = Shade<{ items: Item[] }>({
  shadowDomName: 'large-list',
  render: ({ props }) => {
    // Implement virtual scrolling logic
    // Only render visible items
    const visibleItems = getVisibleItems(props.items);

    return (
      <div style={{ height: '400px', overflow: 'auto' }}>
        {visibleItems.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    );
  },
});
```

## Network Optimization

### Batch Requests

Batch multiple requests when possible:

```typescript
// ✅ Good - batch requests
@Injectable({ lifetime: 'singleton' })
export class DataService {
  public async loadMultipleUsers(userIds: string[]) {
    // Single request for multiple users
    const { result } = await this.apiClient.call({
      method: 'POST',
      action: '/users/batch',
      body: { ids: userIds },
      query: {},
    })
    return result
  }
}

// ❌ Avoid - multiple sequential requests
export class DataService {
  public async loadMultipleUsers(userIds: string[]) {
    const users = []
    for (const id of userIds) {
      const user = await this.loadUser(id) // Sequential!
      users.push(user)
    }
    return users
  }
}
```

### Parallel Requests

Execute independent requests in parallel:

```typescript
// ✅ Good - parallel requests
@Injectable({ lifetime: 'singleton' })
export class DashboardService {
  public async loadDashboard() {
    // Execute in parallel
    const [users, stats, notifications] = await Promise.all([
      this.userService.loadUsers(),
      this.statsService.loadStats(),
      this.notificationService.loadNotifications(),
    ])

    return { users, stats, notifications }
  }
}
```

## Memory Management

> **Note:** For detailed disposal patterns (manual subscriptions, `Symbol.dispose`, service init/dispose), see [OBSERVABLE_STATE.md](./OBSERVABLE_STATE.md). For re-init subscription leak prevention, see [SINGLETON_CONCURRENCY.md](./SINGLETON_CONCURRENCY.md).

## Summary

**Key Principles:**

1. **Minimize subscriptions** - Only subscribe to what you need
2. **Automatic disposal** - Use useObservable and useDisposable
3. **using/usingAsync** - For automatic resource cleanup
4. **Lazy loading** - Code split with dynamic imports
5. **Debounce input** - Reduce unnecessary operations (300ms typical)
6. **Appropriate cache sizes** - Balance memory and performance
7. **Conditional rendering** - Don't render unnecessary content
8. **Virtual scrolling** - For lists with 100+ items
9. **Batch requests** - Combine multiple API calls
10. **Parallel execution** - Use Promise.all for independent operations

**Performance Checklist:**

- [ ] Observable subscriptions minimized
- [ ] useDisposable for local state with cleanup
- [ ] using/usingAsync for operation wrappers
- [ ] Lazy loading for routes and heavy components
- [ ] Debouncing for user input (search, filters)
- [ ] Appropriate cache capacities
- [ ] Conditional rendering for expensive components
- [ ] Virtual scrolling for large lists (100+)
- [ ] Batch and parallel requests
- [ ] No memory leaks (proper disposal)

**Common Patterns:**

- Debounce: 300ms for search, 500ms for auto-save
- Cache: 20-100 for frequent, 500+ for stable data
- Lazy load: Routes, heavy libraries, rarely-used features
- Virtual scroll: Lists with 100+ items
- Batch: Multiple related API calls
- Parallel: Independent async operations

**Tools:**

- Observable: `@furystack/utils/ObservableValue`
- Cache: `@furystack/cache`
- Disposal: `using`, `usingAsync`
- Lazy: Dynamic `import()`
