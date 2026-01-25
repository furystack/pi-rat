import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Button, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Roles } from 'common'
import { getAllRoleDefinitions } from 'common'
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
  render: ({ props, injector, useObservable, useDisposable }) => {
    const usersService = injector.getInstance(UsersService)
    const locationService = injector.getInstance(LocationService)
    const notyService = injector.getInstance(NotyService)

    const { username } = props

    const [userState] = useObservable('user', usersService.getUserAsObservable(username))

    const roleChangeObservable = useDisposable('roleChange', () => new ObservableValue<RoleChange | null>(null))
    const [roleChange] = useObservable('roleChangeValue', roleChangeObservable)

    const isSavingObservable = useDisposable('isSaving', () => new ObservableValue(false))
    const [isSaving] = useObservable('isSavingValue', isSavingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    // Initialize role change state when user is loaded
    if (userState.status === 'loaded' && !roleChange) {
      roleChangeObservable.setValue({
        originalRoles: [...userState.value.roles],
        currentRoles: [...userState.value.roles],
      })
    }

    const navigateBack = () => {
      window.history.pushState({}, '', '/app-settings/users')
      locationService.updateState()
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="outlined" onclick={navigateBack}>
            ← Back
          </Button>
          <h2 style={{ margin: '0', color: 'var(--theme-text-primary)' }}>User Details</h2>
        </div>

        {(userState.status === 'loading' ||
          userState.status === 'uninitialized' ||
          userState.status === 'obsolete') && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading user...</p>
          </Paper>
        )}

        {userState.status === 'failed' && (
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-error-main)' }}>Error: {getErrorMessage(userState.error)}</p>
            <Button variant="outlined" onclick={navigateBack} style={{ marginTop: '12px' }}>
              Go Back
            </Button>
          </Paper>
        )}

        {userState.status === 'loaded' && (
          <>
            <Paper elevation={1} style={{ padding: '24px' }}>
              <h3 style={{ marginTop: '0', marginBottom: '16px', color: 'var(--theme-text-primary)' }}>
                User Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--theme-text-secondary)', fontWeight: '500' }}>Username:</span>
                <span style={{ color: 'var(--theme-text-primary)' }}>{userState.value.username}</span>

                <span style={{ color: 'var(--theme-text-secondary)', fontWeight: '500' }}>Created:</span>
                <span style={{ color: 'var(--theme-text-primary)' }}>{formatDate(userState.value.createdAt)}</span>

                <span style={{ color: 'var(--theme-text-secondary)', fontWeight: '500' }}>Last Updated:</span>
                <span style={{ color: 'var(--theme-text-primary)' }}>{formatDate(userState.value.updatedAt)}</span>
              </div>
            </Paper>

            <Paper elevation={1} style={{ padding: '24px' }}>
              <h3 style={{ marginTop: '0', marginBottom: '16px', color: 'var(--theme-text-primary)' }}>Roles</h3>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minHeight: '32px' }}>
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
                    <span style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic' }}>No roles assigned</span>
                  )}
                </div>
              </div>

              {availableRolesToAdd.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--theme-text-secondary)',
                      fontWeight: '500',
                      fontSize: '14px',
                    }}
                  >
                    Add Role:
                  </label>
                  <select
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid var(--theme-border-default)',
                      backgroundColor: 'var(--theme-background-paper)',
                      color: 'var(--theme-text-primary)',
                      cursor: 'pointer',
                      minWidth: '200px',
                    }}
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

              {validationError && (
                <div
                  style={{
                    color: 'var(--theme-error-main)',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}
                >
                  {validationError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  borderTop: '1px solid var(--theme-border-default)',
                  paddingTop: '16px',
                }}
              >
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
