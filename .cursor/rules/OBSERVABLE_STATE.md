# Observable State Management

## Core Concepts

FuryStack uses **Observable patterns** for reactive state management instead of React hooks or external state libraries.

Key classes:
- `ObservableValue<T>` - Reactive value container
- `useObservable` - Subscribe to observables in Shades components
- `useDisposable` - Create local disposable state in components

## ObservableValue Usage

### Creating Observable Values

```typescript
// ✅ Good - Observable in service
import { ObservableValue } from '@furystack/utils';
import { Injectable } from '@furystack/inject';

@Injectable({ lifetime: 'singleton' })
export class SessionService {
  public currentUser = new ObservableValue<User | null>(null);
  public isAuthenticated = new ObservableValue(false);
  public error = new ObservableValue('');
}
```

### Setting Values

```typescript
// ✅ Good - setting observable values
@Injectable({ lifetime: 'singleton' })
export class SessionService {
  public currentUser = new ObservableValue<User | null>(null);

  public async login(email: string, password: string) {
    try {
      const user = await this.authApi.login({ email, password });
      this.currentUser.setValue(user);
    } catch (error) {
      this.currentUser.setValue(null);
      throw error;
    }
  }

  public logout() {
    this.currentUser.setValue(null);
  }
}
```

### Getting Values

```typescript
// ✅ Good - getting current value
@Injectable({ lifetime: 'singleton' })
export class UserService {
  public currentUser = new ObservableValue<User | null>(null);

  public getCurrentUserName(): string {
    const user = this.currentUser.getValue();
    return user?.name ?? 'Anonymous';
  }
}
```

## useObservable Hook

### Subscribing in Components

Use `useObservable` to subscribe to observables in Shades components:

```typescript
// ✅ Good - useObservable in component
export const UserDisplay = Shade({
  shadowDomName: 'user-display',
  render: ({ injector, useObservable }) => {
    const sessionService = injector.getInstance(SessionService);

    // Subscribe to observable - updates automatically
    const [currentUser] = useObservable('currentUser', sessionService.currentUser);

    if (!currentUser) {
      return <div>Not logged in</div>;
    }

    return (
      <div>
        <p>Welcome, {currentUser.name}!</p>
        <p>{currentUser.email}</p>
      </div>
    );
  },
});
```

### Multiple Subscriptions

Subscribe to multiple observables:

```typescript
// ✅ Good - multiple observable subscriptions
export const Dashboard = Shade({
  shadowDomName: 'dashboard',
  render: ({ injector, useObservable }) => {
    const sessionService = injector.getInstance(SessionService);
    const statsService = injector.getInstance(StatsService);

    const [currentUser] = useObservable('currentUser', sessionService.currentUser);
    const [stats] = useObservable('stats', statsService.stats);
    const [isLoading] = useObservable('loading', statsService.isLoading);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>Dashboard for {currentUser?.name}</h1>
        <div>Total: {stats?.total ?? 0}</div>
      </div>
    );
  },
});
```

## useDisposable Hook

### Local Component State

Use `useDisposable` for component-local reactive state:

```typescript
// ✅ Good - local state with useDisposable
export const SearchForm = Shade({
  shadowDomName: 'search-form',
  render: ({ injector, useDisposable }) => {
    const searchService = injector.getInstance(SearchService);

    // Local component state
    const searchTerm = useDisposable('searchTerm', () => new ObservableValue(''));
    const isSearching = useDisposable('isSearching', () => new ObservableValue(false));
    const error = useDisposable('error', () => new ObservableValue(''));

    const handleSearch = async () => {
      isSearching.setValue(true);
      error.setValue('');

      try {
        await searchService.search(searchTerm.getValue());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        error.setValue(message);
      } finally {
        isSearching.setValue(false);
      }
    };

    return (
      <div>
        <input
          value={searchTerm.getValue()}
          oninput={(ev) => searchTerm.setValue((ev.target as HTMLInputElement).value)}
        />
        <button onclick={() => void handleSearch()} disabled={isSearching.getValue()}>
          {isSearching.getValue() ? 'Searching...' : 'Search'}
        </button>
        {error.getValue() && <div style={{ color: 'red' }}>{error.getValue()}</div>}
      </div>
    );
  },
});
```

### Disposal Pattern

`useDisposable` automatically cleans up when the component unmounts:

```typescript
// ✅ Good - automatic cleanup with useDisposable
export const DataComponent = Shade({
  shadowDomName: 'data-component',
  render: ({ injector, useDisposable }) => {
    const dataService = injector.getInstance(DataService);

    // Automatically disposed when component unmounts
    const subscription = useDisposable('subscription', () => {
      const dispose = dataService.data.subscribe((value) => {
        console.log('Data updated:', value);
      });

      return {
        [Symbol.dispose]: dispose,
      };
    });

    return <div>Component with subscription</div>;
  },
});
```

## Service Layer Observables

### Service State Management

Services should expose observables for reactive state:

```typescript
// ✅ Good - service with observable state
@Injectable({ lifetime: 'singleton' })
export class TodoService {
  @Injected(TodoApiClient)
  private declare apiClient: TodoApiClient;

  public todos = new ObservableValue<Todo[]>([]);
  public isLoading = new ObservableValue(false);
  public error = new ObservableValue('');

  public async loadTodos() {
    this.isLoading.setValue(true);
    this.error.setValue('');

    try {
      const { result } = await this.apiClient.call({
        method: 'GET',
        action: '/todos',
        query: {},
      });
      this.todos.setValue(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load todos';
      this.error.setValue(message);
    } finally {
      this.isLoading.setValue(false);
    }
  }

  public async addTodo(todo: CreateTodoData) {
    const { result } = await this.apiClient.call({
      method: 'POST',
      action: '/todos',
      body: todo,
      query: {},
    });

    // Update observable state
    const currentTodos = this.todos.getValue();
    this.todos.setValue([...currentTodos, result]);
    return result;
  }
}
```

### Computed Observables

Create derived observables from other observables:

```typescript
// ✅ Good - computed observables
@Injectable({ lifetime: 'singleton' })
export class TodoService {
  public todos = new ObservableValue<Todo[]>([]);

  // Computed value based on todos
  public get completedTodosCount(): number {
    return this.todos.getValue().filter(t => t.completed).length;
  }

  // Or use a separate observable that updates when todos change
  public completedCount = new ObservableValue(0);

  private updateCompletedCount() {
    const count = this.todos.getValue().filter(t => t.completed).length;
    this.completedCount.setValue(count);
  }

  public async loadTodos() {
    const { result } = await this.fetchTodos();
    this.todos.setValue(result);
    this.updateCompletedCount(); // Update computed value
  }
}
```

## Subscription Management

### Manual Subscriptions

When manually subscribing, always clean up:

```typescript
// ✅ Good - manual subscription with cleanup
@Injectable({ lifetime: 'singleton' })
export class SyncService {
  @Injected(DataService)
  private declare dataService: DataService;

  private subscription?: { dispose: () => void };

  public startSync() {
    this.subscription = this.dataService.data.subscribe((value) => {
      this.syncToServer(value);
    });
  }

  public stopSync() {
    this.subscription?.dispose();
    this.subscription = undefined;
  }

  public [Symbol.dispose]() {
    this.stopSync();
  }
}
```

### Subscription in Components

Always use `useObservable` or `useDisposable` for automatic cleanup:

```typescript
// ✅ Good - automatic subscription cleanup
export const DataDisplay = Shade({
  shadowDomName: 'data-display',
  render: ({ injector, useObservable }) => {
    const dataService = injector.getInstance(DataService);

    // Subscription automatically cleaned up on unmount
    const [data] = useObservable('data', dataService.data);

    return <div>{data}</div>;
  },
});

// ❌ Avoid - manual subscription without cleanup
export const DataDisplay = Shade({
  shadowDomName: 'data-display',
  render: ({ injector }) => {
    const dataService = injector.getInstance(DataService);
    let data = '';

    // Memory leak! Subscription never cleaned up
    dataService.data.subscribe((value) => {
      data = value;
    });

    return <div>{data}</div>;
  },
});
```

## Operation Wrappers for Loading States

### Using Disposal for Loading States

Create operation wrappers for automatic loading state management:

```typescript
// ✅ Good - operation wrapper pattern
@Injectable({ lifetime: 'singleton' })
export class DataService {
  public isLoading = new ObservableValue(false);
  public data = new ObservableValue<Data | null>(null);

  private operation() {
    this.isLoading.setValue(true);
    return {
      [Symbol.dispose]: () => {
        this.isLoading.setValue(false);
      },
    };
  }

  public async loadData() {
    await usingAsync(this.operation(), async () => {
      const result = await this.fetchData();
      this.data.setValue(result);
    });
  }

  public async updateData(updates: Partial<Data>) {
    await usingAsync(this.operation(), async () => {
      const result = await this.updateDataOnServer(updates);
      this.data.setValue(result);
    });
  }
}
```

## Observable Patterns

### Loading/Error/Success Pattern

Standard pattern for async operations:

```typescript
// ✅ Good - loading/error/success pattern
@Injectable({ lifetime: 'singleton' })
export class UserService {
  public users = new ObservableValue<User[]>([]);
  public isLoading = new ObservableValue(false);
  public error = new ObservableValue('');

  public async loadUsers() {
    this.isLoading.setValue(true);
    this.error.setValue('');

    try {
      const { result } = await this.apiClient.call({
        method: 'GET',
        action: '/users',
        query: {},
      });
      this.users.setValue(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      this.error.setValue(message);
      this.users.setValue([]);
    } finally {
      this.isLoading.setValue(false);
    }
  }
}

// Component usage
export const UserList = Shade({
  shadowDomName: 'user-list',
  render: ({ injector, useObservable }) => {
    const userService = injector.getInstance(UserService);

    const [users] = useObservable('users', userService.users);
    const [isLoading] = useObservable('loading', userService.isLoading);
    const [error] = useObservable('error', userService.error);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    );
  },
});
```

### Form State Pattern

Manage form state with observables:

```typescript
// ✅ Good - form state with observables
export const LoginForm = Shade({
  shadowDomName: 'login-form',
  render: ({ injector, useDisposable }) => {
    const authService = injector.getInstance(AuthService);

    const email = useDisposable('email', () => new ObservableValue(''));
    const password = useDisposable('password', () => new ObservableValue(''));
    const isSubmitting = useDisposable('submitting', () => new ObservableValue(false));
    const error = useDisposable('error', () => new ObservableValue(''));

    const handleSubmit = async (ev: Event) => {
      ev.preventDefault();
      isSubmitting.setValue(true);
      error.setValue('');

      try {
        await authService.login(email.getValue(), password.getValue());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        error.setValue(message);
      } finally {
        isSubmitting.setValue(false);
      }
    };

    return (
      <form onsubmit={handleSubmit}>
        <input
          type="email"
          value={email.getValue()}
          oninput={(ev) => email.setValue((ev.target as HTMLInputElement).value)}
        />
        <input
          type="password"
          value={password.getValue()}
          oninput={(ev) => password.setValue((ev.target as HTMLInputElement).value)}
        />
        {error.getValue() && <div style={{ color: 'red' }}>{error.getValue()}</div>}
        <button type="submit" disabled={isSubmitting.getValue()}>
          {isSubmitting.getValue() ? 'Logging in...' : 'Login'}
        </button>
      </form>
    );
  },
});
```

## Summary

**Key Principles:**

1. **ObservableValue** for reactive state
2. **useObservable** for subscribing in components
3. **useDisposable** for local component state
4. **Services expose observables** for reactive state
5. **Automatic cleanup** with useObservable and useDisposable
6. **Operation wrappers** for loading state management
7. **Loading/Error/Success pattern** for async operations
8. **Manual subscriptions** must be disposed manually
9. **Computed observables** for derived state
10. **Symbol.dispose** for resource cleanup

**Observable State Checklist:**

- [ ] Services expose ObservableValue for state
- [ ] Components use useObservable for subscriptions
- [ ] Local state uses useDisposable
- [ ] Loading/error/success pattern for async operations
- [ ] Operation wrappers for loading states
- [ ] Manual subscriptions are disposed
- [ ] Symbol.dispose for service cleanup
- [ ] No memory leaks (subscriptions cleaned up)
- [ ] Type-safe observables

**Common Patterns:**

- Service state: `public data = new ObservableValue<T>(initial)`
- Component subscription: `const [data] = useObservable('key', service.data)`
- Local state: `const state = useDisposable('key', () => new ObservableValue(initial))`
- Loading wrapper: `using/usingAsync` with operation function
- Form state: Multiple ObservableValue instances for fields

**Tools:**

- Observable: `@furystack/utils/ObservableValue`
- Hooks: `useObservable`, `useDisposable` from Shades
- Disposal: `using`, `usingAsync`, `Symbol.dispose`
