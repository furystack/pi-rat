import { createComponent, Shade } from '@furystack/shades'
import { Button, Paper } from '@furystack/shades-common-components'
import { navigateToRoute } from '../../navigate-to-route.js'
import { RoleTag } from '../../components/role-tag/index.js'
import { UsersService } from '../../services/users-service.js'

type UserListPageProps = Record<string, never>

export const UserListPage = Shade<UserListPageProps>({
  shadowDomName: 'user-list-page',
  css: {
    '& .page-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      height: '100%',
    },
    '& .page-title': {
      marginBottom: '8px',
      color: 'var(--theme-text-primary)',
    },
    '& .page-description': {
      marginBottom: '24px',
      color: 'var(--theme-text-secondary)',
    },
    '& .loading-text': {
      color: 'var(--theme-text-secondary)',
    },
    '& .error-text': {
      color: 'var(--theme-error-main)',
    },
    '& .users-table': {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
    },
    '& thead tr': {
      backgroundColor: 'var(--theme-background-default)',
      borderBottom: '1px solid var(--theme-border-default)',
    },
    '& th': {
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: '600',
      color: 'var(--theme-text-primary)',
    },
    '& th.actions-col': {
      textAlign: 'right',
    },
    '& tbody tr': {
      borderBottom: '1px solid var(--theme-border-default)',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    },
    '& tbody tr:hover': {
      backgroundColor: 'var(--theme-background-default)',
    },
    '& td': {
      padding: '12px 16px',
    },
    '& .username-cell': {
      color: 'var(--theme-text-primary)',
      fontWeight: '500',
    },
    '& .roles-cell': {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    '& .no-roles': {
      color: 'var(--theme-text-secondary)',
      fontStyle: 'italic',
    },
    '& .created-cell': {
      color: 'var(--theme-text-secondary)',
    },
    '& .actions-cell': {
      textAlign: 'right',
    },
    '& .empty-row td': {
      padding: '24px 16px',
      textAlign: 'center',
      color: 'var(--theme-text-secondary)',
    },
  },
  render: ({ injector, useObservable }) => {
    const usersService = injector.getInstance(UsersService)

    const [usersState] = useObservable('users', usersService.findUsersAsObservable({}))

    const navigateToUser = (username: string) => {
      navigateToRoute(injector, '/app-settings/users/:username', { username })
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
      void usersService.findUsers({})
    }

    const getErrorMessage = (error: unknown): string => {
      if (error instanceof Error) return error.message
      return 'Failed to load users'
    }

    return (
      <div className="page-container">
        <h2 className="page-title">👥 Users</h2>
        <p className="page-description">Manage user accounts and their roles.</p>

        {(usersState.status === 'loading' || usersState.status === 'obsolete') && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="loading-text">Loading users...</p>
          </Paper>
        )}

        {usersState.status === 'failed' && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="error-text">Error: {getErrorMessage(usersState.error)}</p>
            <Button variant="outlined" onclick={handleRetry} style={{ marginTop: '12px' }}>
              Retry
            </Button>
          </Paper>
        )}

        {usersState.status === 'loaded' && (
          <Paper elevation={1} style={{ padding: '0', overflow: 'hidden' }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Roles</th>
                  <th>Created</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersState.value.entries.map((user) => (
                  <tr onclick={() => navigateToUser(user.username)}>
                    <td className="username-cell">{user.username}</td>
                    <td>
                      <div className="roles-cell">
                        {user.roles.length > 0 ? (
                          user.roles.map((roleName) => <RoleTag roleName={roleName} variant="default" />)
                        ) : (
                          <span className="no-roles">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="created-cell">{formatDate(user.createdAt)}</td>
                    <td className="actions-cell">
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
                  <tr className="empty-row">
                    <td colSpan={4}>No users found.</td>
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
