import { hasCacheValue, isFailedCacheResult } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Roles } from 'common'
import { getAllRoleDefinitions } from 'common'
import { navigateToRoute } from '../../navigate-to-route.js'
import { RoleTag } from '../../components/role-tag/index.js'
import { UsersService } from '../../services/users-service.js'

type UserDetailsPageProps = {
  username: string
}

type RoleChange = {
  originalRoles: Roles
  currentRoles: Roles
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
    '& .loading-text': {
      color: 'var(--theme-text-secondary)',
    },
    '& .error-text': {
      color: 'var(--theme-error-main)',
    },
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

    const { username } = props

    const [userState] = useObservable('user', usersService.getUserAsObservable(username))

    const roleChangeObservable = useDisposable('roleChange', () => new ObservableValue<RoleChange | null>(null))
    const [roleChange] = useObservable('roleChangeValue', roleChangeObservable)

    const isSavingObservable = useDisposable('isSaving', () => new ObservableValue(false))
    const [isSaving] = useObservable('isSavingValue', isSavingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    // Track if role state has been initialized to prevent re-initialization during render cycles
    const isRoleStateInitialized = useDisposable('isRoleStateInitialized', () => new ObservableValue(false))

    // Initialize role change state when user is loaded (check synchronously to avoid race conditions)
    if (userState.status === 'loaded' && !isRoleStateInitialized.getValue()) {
      isRoleStateInitialized.setValue(true)
      roleChangeObservable.setValue({
        originalRoles: [...userState.value.roles],
        currentRoles: [...userState.value.roles],
      })
    }

    const navigateBack = () => {
      navigateToRoute(injector, '/app-settings/users')
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

    const getErrorMessage = (error: unknown): string => {
      if (error instanceof Error) return error.message
      return 'Failed to load user'
    }

    const addRole = (roleName: Roles[number]) => {
      if (userState.status !== 'loaded') return
      const current = roleChange?.currentRoles ?? userState.value.roles
      const original = roleChange?.originalRoles ?? userState.value.roles
      if (current.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: [...current, roleName],
      })
      validationErrorObservable.setValue(null)
    }

    const removeRole = (roleName: Roles[number]) => {
      if (userState.status !== 'loaded') return
      const current = roleChange?.currentRoles ?? userState.value.roles
      const original = roleChange?.originalRoles ?? userState.value.roles
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: current.filter((r) => r !== roleName),
      })
    }

    const restoreRole = (roleName: Roles[number]) => {
      if (userState.status !== 'loaded') return
      const current = roleChange?.currentRoles ?? userState.value.roles
      const original = roleChange?.originalRoles ?? userState.value.roles
      if (current.includes(roleName)) return
      roleChangeObservable.setValue({
        originalRoles: [...original],
        currentRoles: [...current, roleName],
      })
      validationErrorObservable.setValue(null)
    }

    const getRoleVariant = (roleName: Roles[number]): 'default' | 'added' | 'removed' => {
      if (userState.status !== 'loaded') return 'default'
      const original = roleChange?.originalRoles ?? userState.value.roles
      const current = roleChange?.currentRoles ?? userState.value.roles
      const isInOriginal = original.includes(roleName)
      const isInCurrent = current.includes(roleName)

      if (isInOriginal && isInCurrent) return 'default'
      if (!isInOriginal && isInCurrent) return 'added'
      if (isInOriginal && !isInCurrent) return 'removed'
      return 'default'
    }

    const hasChanges = () => {
      if (userState.status !== 'loaded') return false
      const original = roleChange?.originalRoles ?? userState.value.roles
      const current = roleChange?.currentRoles ?? userState.value.roles
      const originalSorted = [...original].sort()
      const currentSorted = [...current].sort()
      if (originalSorted.length !== currentSorted.length) return true
      return originalSorted.some((role, idx) => role !== currentSorted[idx])
    }

    const handleSave = async () => {
      if (userState.status !== 'loaded') return

      const current = roleChange?.currentRoles ?? userState.value.roles

      // Validation
      if (current.length === 0) {
        validationErrorObservable.setValue('User must have at least one role')
        return
      }

      isSavingObservable.setValue(true)
      validationErrorObservable.setValue(null)

      try {
        await usersService.updateUser(username, {
          username: userState.value.username,
          roles: current,
        })

        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'User roles updated successfully',
          type: 'success',
        })

        // Update the original roles to reflect saved state (guard against disposal during async operation)
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
        // Guard against disposal during async operation (component may have unmounted)
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

    // Get current roles from roleChange if available, otherwise from userState
    const currentRoles = roleChange?.currentRoles ?? (userState.status === 'loaded' ? userState.value.roles : [])
    const originalRoles = roleChange?.originalRoles ?? (userState.status === 'loaded' ? userState.value.roles : [])

    const availableRolesToAdd = allRoles.filter((role) => !currentRoles.includes(role.name))

    // Get all roles to display (current + removed)
    const rolesToDisplay = [
      ...new Set([
        ...originalRoles, // Include original roles (may be removed)
        ...currentRoles, // Include current roles (may be added)
      ]),
    ]

    return (
      <div className="page-container">
        <div className="page-header">
          <Button variant="outlined" onclick={navigateBack}>
            ← Back
          </Button>
          <h2>User Details</h2>
        </div>

        {(userState.status === 'loading' ||
          userState.status === 'uninitialized' ||
          userState.status === 'obsolete') && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="loading-text">Loading user...</p>
          </Paper>
        )}

        {isFailedCacheResult(userState) && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="error-text">Error: {getErrorMessage(userState.error)}</p>
            <Button variant="outlined" onclick={navigateBack} style={{ marginTop: '12px' }}>
              Go Back
            </Button>
          </Paper>
        )}

        {hasCacheValue(userState) && (
          <>
            <Paper elevation={1} style={{ padding: '24px' }}>
              <h3 className="section-title">User Information</h3>

              <div className="info-grid">
                <span className="info-label">Username:</span>
                <span className="info-value">{userState.value.username}</span>

                <span className="info-label">Created:</span>
                <span className="info-value">{formatDate(userState.value.createdAt)}</span>

                <span className="info-label">Last Updated:</span>
                <span className="info-value">{formatDate(userState.value.updatedAt)}</span>
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
        )}
      </div>
    )
  },
})
