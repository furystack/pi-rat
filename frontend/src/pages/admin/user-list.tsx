import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Button, Paper } from '@furystack/shades-common-components'
import { RoleTag } from '../../components/role-tag/index.js'
import { UsersService } from '../../services/users-service.js'

type UserListPageProps = Record<string, never>

export const UserListPage = Shade<UserListPageProps>({
  shadowDomName: 'user-list-page',
  render: ({ injector, useObservable }) => {
    const usersService = injector.getInstance(UsersService)
    const locationService = injector.getInstance(LocationService)

    const [usersState] = useObservable('users', usersService.findUsersAsObservable({}))

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

    const handleRetry = () => {
      usersService.userQueryCache.flushAll()
      usersService.findUsers({})
    }

    const getErrorMessage = (error: unknown): string => {
      if (error instanceof Error) return error.message
      return 'Failed to load users'
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <h2 style={{ marginBottom: '8px', color: 'var(--theme-text-primary)' }}>👥 Users</h2>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Manage user accounts and their roles.
        </p>

        {(usersState.status === 'loading' || usersState.status === 'uninitialized' || usersState.status === 'obsolete') && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading users...</p>
          </Paper>
        )}

        {usersState.status === 'failed' && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-error-main)' }}>Error: {getErrorMessage(usersState.error)}</p>
            <Button variant="outlined" onclick={handleRetry} style={{ marginTop: '12px' }}>
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
                {usersState.value.entries.map((user) => (
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
                {usersState.value.entries.length === 0 && (
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
