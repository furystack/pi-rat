import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, PageContainer, PageHeader, Paper, Skeleton } from '@furystack/shades-common-components'
import type { User } from 'common'
import { navigateToRoute } from '../../navigate-to-route.js'
import { RoleTag } from '../../components/role-tag/index.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { UsersService } from '../../services/users-service.js'

const UserListContent = Shade<{ data: CacheWithValue<GetCollectionResult<User>> }>({
  shadowDomName: 'user-list-content',
  css: {
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
  render: ({ props, injector }) => {
    const usersState = props.data

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

    return (
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
    )
  },
})

type UserListPageProps = Record<string, never>

export const UserListPage = Shade<UserListPageProps>({
  shadowDomName: 'user-list-page',
  render: ({ injector }) => {
    const usersService = injector.getInstance(UsersService)

    return (
      <PageContainer gap="24px">
        <PageHeader title="👥 Users" description="Manage user accounts and their roles." />
        <CacheView
          cache={usersService.userQueryCache}
          args={[{}]}
          content={UserListContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </PageContainer>
    )
  },
})
