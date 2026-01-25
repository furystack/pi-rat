import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Button, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { User } from 'common'
import { RoleTag } from '../../components/role-tag/index.js'
import { IdentityApiClient } from '../../services/api-clients/identity-api-client.js'

type UserListPageProps = Record<string, never>

type UsersState =
  | { status: 'loading' }
  | { status: 'loaded'; users: User[] }
  | { status: 'error'; message: string }

export const UserListPage = Shade<UserListPageProps>({
  shadowDomName: 'user-list-page',
  render: ({ injector, useObservable, useDisposable }) => {
    const apiClient = injector.getInstance(IdentityApiClient)
    const locationService = injector.getInstance(LocationService)

    const usersStateObservable = useDisposable('usersState', () => new ObservableValue<UsersState>({ status: 'loading' }))
    const [usersState] = useObservable('usersStateValue', usersStateObservable)

    // Fetch users on mount
    useDisposable('fetchUsers', () => {
      const fetchUsers = async () => {
        try {
          const { result } = await apiClient.call({
            method: 'GET',
            action: '/users',
            query: {},
          })
          usersStateObservable.setValue({ status: 'loaded', users: result.entries })
        } catch (error) {
          usersStateObservable.setValue({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load users',
          })
        }
      }
      void fetchUsers()
      return { [Symbol.dispose]: () => {} }
    })

    const navigateToUser = (username: string) => {
      window.history.pushState({}, '', `/app-settings/users/${encodeURIComponent(username)}`)
      locationService.updateState()
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <h2 style={{ marginBottom: '8px', color: 'var(--theme-text-primary)' }}>👥 Users</h2>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Manage user accounts and their roles.
        </p>

        {usersState.status === 'loading' && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading users...</p>
          </Paper>
        )}

        {usersState.status === 'error' && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-error-main)' }}>Error: {usersState.message}</p>
            <Button
              variant="outlined"
              onclick={() => {
                usersStateObservable.setValue({ status: 'loading' })
                void apiClient
                  .call({ method: 'GET', action: '/users', query: {} })
                  .then(({ result }) => {
                    usersStateObservable.setValue({ status: 'loaded', users: result.entries })
                  })
                  .catch((error) => {
                    usersStateObservable.setValue({
                      status: 'error',
                      message: error instanceof Error ? error.message : 'Failed to load users',
                    })
                  })
              }}
              style={{ marginTop: '12px' }}
            >
              Retry
            </Button>
          </Paper>
        )}

        {usersState.status === 'loaded' && (
          <Paper elevation={1} style={{ padding: '0', overflow: 'hidden' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--theme-background-default)',
                    borderBottom: '1px solid var(--theme-border-default)',
                  }}
                >
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Username
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Roles
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersState.users.map((user) => (
                  <tr
                    style={{
                      borderBottom: '1px solid var(--theme-border-default)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onclick={() => navigateToUser(user.username)}
                    onmouseenter={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'var(--theme-background-default)'
                    }}
                    onmouseleave={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--theme-text-primary)',
                        fontWeight: '500',
                      }}
                    >
                      {user.username}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {user.roles.length > 0 ? (
                          user.roles.map((roleName) => <RoleTag roleName={roleName} variant="default" />)
                        ) : (
                          <span style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic' }}>No roles</span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button
                        variant="outlined"
                        onclick={(e) => {
                          e.stopPropagation()
                          navigateToUser(user.username)
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
                {usersState.users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Paper>
        )}
      </div>
    )
  },
})
