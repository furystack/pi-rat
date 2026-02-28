import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, NotyService, Paper, Skeleton } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Roles, User } from 'common'
import { getAllRoleDefinitions } from 'common'
import { navigateToRoute } from '../../navigate-to-route.js'
import { RoleTag } from '../../components/role-tag/index.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { UsersService } from '../../services/users-service.js'

type RoleChange = {
  originalRoles: Roles
  currentRoles: Roles
}

const UserDetailsContent = Shade<{ data: CacheWithValue<User> }>({
  shadowDomName: 'user-details-content',
  css: {
    '& .section-title': {
      marginTop: '0',
      marginBottom: '16px',
      color: 'var(--theme-text-primary)',
    },
    '& .info-grid': {
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      gap: '12px',
      alignItems: 'center',
    },
    '& .info-label': {
      color: 'var(--theme-text-secondary)',
      fontWeight: '500',
    },
    '& .info-value': {
      color: 'var(--theme-text-primary)',
    },
    '& .roles-container': {
      marginBottom: '16px',
    },
    '& .roles-list': {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      minHeight: '32px',
    },
    '& .no-roles': {
      color: 'var(--theme-text-secondary)',
      fontStyle: 'italic',
    },
    '& .add-role-container': {
      marginBottom: '16px',
    },
    '& .add-role-label': {
      display: 'block',
      marginBottom: '8px',
      color: 'var(--theme-text-secondary)',
      fontWeight: '500',
      fontSize: '14px',
    },
    '& .add-role-select': {
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '1px solid var(--theme-border-default)',
      backgroundColor: 'var(--theme-background-paper)',
      color: 'var(--theme-text-primary)',
      cursor: 'pointer',
      minWidth: '200px',
    },
    '& .validation-error': {
      color: 'var(--theme-error-main)',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px',
    },
    '& .button-row': {
      display: 'flex',
      gap: '12px',
      borderTop: '1px solid var(--theme-border-default)',
      paddingTop: '16px',
    },
  },
  render: ({ props, injector, useObservable, useDisposable }) => {
    const usersService = injector.getInstance(UsersService)
    const notyService = injector.getInstance(NotyService)
    const user = props.data.value

    const roleChangeObservable = useDisposable('roleChange', () => new ObservableValue<RoleChange | null>(null))
    const [roleChange] = useObservable('roleChangeValue', roleChangeObservable)

    const isSavingObservable = useDisposable('isSaving', () => new ObservableValue(false))
    const [isSaving] = useObservable('isSavingValue', isSavingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    const isRoleStateInitialized = useDisposable('isRoleStateInitialized', () => new ObservableValue(false))

    if (!isRoleStateInitialized.getValue()) {
      isRoleStateInitialized.setValue(true)
      roleChangeObservable.setValue({
        originalRoles: [...user.roles],
        currentRoles: [...user.roles],
      })
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const addRole = (roleName: Roles[number]) => {
      const current = roleChange?.currentRoles ?? user.roles
      const original = roleChange?.originalRoles ?? user.roles
      if (current.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: [...current, roleName],
      })
      validationErrorObservable.setValue(null)
    }

    const removeRole = (roleName: Roles[number]) => {
      const current = roleChange?.currentRoles ?? user.roles
      const original = roleChange?.originalRoles ?? user.roles
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: current.filter((r) => r !== roleName),
      })
    }

    const restoreRole = (roleName: Roles[number]) => {
      const current = roleChange?.currentRoles ?? user.roles
      const original = roleChange?.originalRoles ?? user.roles
      if (current.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: [...current, roleName],
      })
      validationErrorObservable.setValue(null)
    }

    const getRoleVariant = (roleName: Roles[number]): 'default' | 'added' | 'removed' => {
      const original = roleChange?.originalRoles ?? user.roles
      const current = roleChange?.currentRoles ?? user.roles
      const isInOriginal = original.includes(roleName)
      const isInCurrent = current.includes(roleName)

      if (isInOriginal && isInCurrent) return 'default'
      if (!isInOriginal && isInCurrent) return 'added'
      if (isInOriginal && !isInCurrent) return 'removed'
      return 'default'
    }

    const hasChanges = () => {
      const original = roleChange?.originalRoles ?? user.roles
      const current = roleChange?.currentRoles ?? user.roles
      const originalSorted = [...original].sort()
      const currentSorted = [...current].sort()
      if (originalSorted.length !== currentSorted.length) return true
      return originalSorted.some((role, idx) => role !== currentSorted[idx])
    }

    const handleSave = async () => {
      const current = roleChange?.currentRoles ?? user.roles

      if (current.length === 0) {
        validationErrorObservable.setValue('User must have at least one role')
        return
      }

      isSavingObservable.setValue(true)
      validationErrorObservable.setValue(null)

      try {
        await usersService.updateUser(user.username, {
          username: user.username,
          roles: current,
        })

        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'User roles updated successfully',
          type: 'success',
        })

        if (!roleChangeObservable.isDisposed) {
          roleChangeObservable.setValue({
            originalRoles: [...current],
            currentRoles: [...current],
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save user'
        notyService.emit('onNotyAdded', {
          title: 'Error',
          body: errorMessage,
          type: 'error',
        })
      } finally {
        if (!isSavingObservable.isDisposed) {
          isSavingObservable.setValue(false)
        }
      }
    }

    const handleCancel = () => {
      if (roleChange) {
        roleChangeObservable.setValue({
          ...roleChange,
          currentRoles: [...roleChange.originalRoles],
        })
        validationErrorObservable.setValue(null)
      }
    }

    const allRoles = getAllRoleDefinitions()

    const currentRoles = roleChange?.currentRoles ?? user.roles
    const originalRoles = roleChange?.originalRoles ?? user.roles

    const availableRolesToAdd = allRoles.filter((role) => !currentRoles.includes(role.name))

    const rolesToDisplay = [...new Set([...originalRoles, ...currentRoles])]

    return (
      <>
        <Paper elevation={1} style={{ padding: '24px' }}>
          <h3 className="section-title">User Information</h3>

          <div className="info-grid">
            <span className="info-label">Username:</span>
            <span className="info-value">{user.username}</span>

            <span className="info-label">Created:</span>
            <span className="info-value">{formatDate(user.createdAt)}</span>

            <span className="info-label">Last Updated:</span>
            <span className="info-value">{formatDate(user.updatedAt)}</span>
          </div>
        </Paper>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <h3 className="section-title">Roles</h3>

          <div className="roles-container">
            <div className="roles-list">
              {rolesToDisplay.length > 0 ? (
                rolesToDisplay.map((roleName) => {
                  const variant = getRoleVariant(roleName)
                  return (
                    <RoleTag
                      roleName={roleName}
                      variant={variant}
                      onRemove={variant !== 'removed' ? () => removeRole(roleName) : undefined}
                      onRestore={variant === 'removed' ? () => restoreRole(roleName) : undefined}
                    />
                  )
                })
              ) : (
                <span className="no-roles">No roles assigned</span>
              )}
            </div>
          </div>

          {availableRolesToAdd.length > 0 && (
            <div className="add-role-container">
              <label className="add-role-label">Add Role:</label>
              <select
                className="add-role-select"
                onchange={(e) => {
                  const select = e.target as HTMLSelectElement
                  const roleName = select.value as Roles[number]
                  if (roleName) {
                    addRole(roleName)
                    select.value = ''
                  }
                }}
              >
                <option value="">Select a role to add...</option>
                {availableRolesToAdd.map((role) => (
                  <option value={role.name}>{role.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {validationError && <div className="validation-error">{validationError}</div>}

          <div className="button-row">
            <Button
              variant="contained"
              color="primary"
              onclick={() => void handleSave()}
              disabled={isSaving || !hasChanges()}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outlined" onclick={handleCancel} disabled={isSaving || !hasChanges()}>
              Cancel
            </Button>
          </div>
        </Paper>
      </>
    )
  },
})

type UserDetailsPageProps = {
  username: string
}

export const UserDetailsPage = Shade<UserDetailsPageProps>({
  shadowDomName: 'user-details-page',
  css: {
    '& .page-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      height: '100%',
    },
    '& .page-header': {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    '& .page-header h2': {
      margin: '0',
      color: 'var(--theme-text-primary)',
    },
  },
  render: ({ props, injector }) => {
    const usersService = injector.getInstance(UsersService)

    const navigateBack = () => {
      navigateToRoute(injector, '/app-settings/users')
    }

    return (
      <div className="page-container">
        <div className="page-header">
          <Button variant="outlined" onclick={navigateBack}>
            ← Back
          </Button>
          <h2>User Details</h2>
        </div>
        <CacheView
          cache={usersService.userCache}
          args={[props.username]}
          content={UserDetailsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </div>
    )
  },
})
