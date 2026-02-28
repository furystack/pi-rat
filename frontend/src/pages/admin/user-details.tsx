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
  render: ({ props, injector, useState, useObservable, useDisposable }) => {
    const usersService = injector.getInstance(UsersService)
    const notyService = injector.getInstance(NotyService)
    const user = props.data.value

    const roleChangeObservable = useDisposable(
      'roleChange',
      () =>
        new ObservableValue<RoleChange>({
          originalRoles: [...user.roles],
          currentRoles: [...user.roles],
        }),
    )
    const [roleChange] = useObservable('roleChangeValue', roleChangeObservable)

    const [isSaving, setIsSaving] = useState('isSaving', false)
    const [validationError, setValidationError] = useState<string | null>('validationError', null)
    const [selectedRole, setSelectedRole] = useState('selectedRole', '')

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const { currentRoles, originalRoles } = roleChange

    const addRole = (roleName: Roles[number]) => {
      if (currentRoles.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...originalRoles],
        currentRoles: [...currentRoles, roleName],
      })
      setValidationError(null)
    }

    const removeRole = (roleName: Roles[number]) => {
      roleChangeObservable.setValue({
        originalRoles: [...originalRoles],
        currentRoles: currentRoles.filter((r) => r !== roleName),
      })
    }

    const restoreRole = (roleName: Roles[number]) => {
      if (currentRoles.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...originalRoles],
        currentRoles: [...currentRoles, roleName],
      })
      setValidationError(null)
    }

    const getRoleVariant = (roleName: Roles[number]): 'default' | 'added' | 'removed' => {
      const isInOriginal = originalRoles.includes(roleName)
      const isInCurrent = currentRoles.includes(roleName)

      if (isInOriginal && isInCurrent) return 'default'
      if (!isInOriginal && isInCurrent) return 'added'
      if (isInOriginal && !isInCurrent) return 'removed'
      return 'default'
    }

    const hasChanges = () => {
      const originalSorted = [...originalRoles].sort()
      const currentSorted = [...currentRoles].sort()
      if (originalSorted.length !== currentSorted.length) return true
      return originalSorted.some((role, idx) => role !== currentSorted[idx])
    }

    const handleSave = async () => {
      if (currentRoles.length === 0) {
        setValidationError('User must have at least one role')
        return
      }

      setIsSaving(true)
      setValidationError(null)

      try {
        await usersService.updateUser(user.username, {
          username: user.username,
          roles: currentRoles,
        })

        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'User roles updated successfully',
          type: 'success',
        })

        if (!roleChangeObservable.isDisposed) {
          roleChangeObservable.setValue({
            originalRoles: [...currentRoles],
            currentRoles: [...currentRoles],
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
        if (!roleChangeObservable.isDisposed) {
          setIsSaving(false)
        }
      }
    }

    const handleCancel = () => {
      roleChangeObservable.setValue({
        ...roleChange,
        currentRoles: [...roleChange.originalRoles],
      })
      setValidationError(null)
    }

    const allRoles = getAllRoleDefinitions()

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
                value={selectedRole}
                onchange={(e) => {
                  const roleName = (e.target as HTMLSelectElement).value as Roles[number]
                  if (roleName) {
                    addRole(roleName)
                    setSelectedRole('')
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
