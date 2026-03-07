import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  CacheView,
  Chip,
  cssVariableTheme,
  Icon,
  icons,
  NotyService,
  PageContainer,
  PageHeader,
  Paper,
  Select,
  Skeleton,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Roles, User } from 'common'
import { getAllRoleDefinitions, getRoleDefinition } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { UsersService } from '../../services/users-service.js'

type RoleChange = {
  originalRoles: Roles
  currentRoles: Roles
}

const UserDetailsContent = Shade<{ data: CacheWithValue<User> }>({
  customElementName: 'user-details-content',
  css: {
    '& .section-title': {
      marginTop: '0',
      marginBottom: '16px',
      color: cssVariableTheme.text.primary,
    },
    '& .info-grid': {
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      gap: '12px',
      alignItems: 'center',
    },
    '& .info-label': {
      color: cssVariableTheme.text.secondary,
      fontWeight: '500',
    },
    '& .info-value': {
      color: cssVariableTheme.text.primary,
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
      color: cssVariableTheme.text.secondary,
      fontStyle: 'italic',
    },
    '& .add-role-container': {
      marginBottom: '16px',
    },
    '& .validation-error': {
      color: cssVariableTheme.palette.error.main,
      backgroundColor: cssVariableTheme.palette.error.light,
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px',
    },
    '& .button-row': {
      display: 'flex',
      gap: '12px',
      borderTop: `1px solid ${cssVariableTheme.action.subtleBorder}`,
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
          <Typography variant="h3" className="section-title">
            User Information
          </Typography>

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
          <Typography variant="h3" className="section-title">
            Roles
          </Typography>

          <div className="roles-container">
            <div className="roles-list">
              {rolesToDisplay.length > 0 ? (
                rolesToDisplay.map((roleName) => {
                  const variant = getRoleVariant(roleName)
                  const role = getRoleDefinition(roleName)
                  const chipColor = variant === 'added' ? 'success' : variant === 'removed' ? 'error' : undefined
                  const onDelete = variant === 'removed' ? () => restoreRole(roleName) : () => removeRole(roleName)

                  return (
                    <Chip
                      variant="outlined"
                      color={chipColor}
                      onDelete={onDelete}
                      title={role.description}
                      style={variant === 'removed' ? { textDecoration: 'line-through' } : undefined}
                    >
                      {role.displayName}
                    </Chip>
                  )
                })
              ) : (
                <span className="no-roles">No roles assigned</span>
              )}
            </div>
          </div>

          {availableRolesToAdd.length > 0 && (
            <div className="add-role-container">
              <Select
                labelTitle="Add Role"
                placeholder="Select a role to add..."
                options={availableRolesToAdd.map((role) => ({ value: role.name, label: role.displayName }))}
                value={selectedRole}
                onValueChange={(value) => {
                  const roleName = value as Roles[number]
                  if (roleName) {
                    addRole(roleName)
                    setSelectedRole('')
                  }
                }}
                style={{ minWidth: '200px' }}
              />
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
  customElementName: 'user-details-page',
  render: ({ props, injector }) => {
    const usersService = injector.getInstance(UsersService)

    return (
      <PageContainer gap="24px">
        <PageHeader icon={<Icon icon={icons.user} />} title="User Details" />
        <CacheView
          cache={usersService.userCache}
          args={[props.username]}
          content={UserDetailsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </PageContainer>
    )
  },
})
