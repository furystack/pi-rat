import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  cssVariableTheme,
  Form,
  Input,
  NotyService,
  Paper,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { SessionService } from '../../services/session.js'

export type PasswordResetPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const isPasswordResetPayload = (data: unknown): data is PasswordResetPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.currentPassword === 'string' &&
    d.currentPassword.length > 0 &&
    typeof d.newPassword === 'string' &&
    d.newPassword.length > 0 &&
    typeof d.confirmPassword === 'string' &&
    d.confirmPassword.length > 0 &&
    d.newPassword === d.confirmPassword
  )
}

const SecuritySection = Shade({
  shadowDomName: 'user-settings-security',
  css: {
    marginTop: '24px',
    '& h3': {
      marginBottom: '16px',
      color: cssVariableTheme.text.primary,
    },
    '& h4': {
      marginBottom: '16px',
      color: cssVariableTheme.text.primary,
    },
    '& .error-message': {
      color: cssVariableTheme.palette.error.main,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      marginBottom: '16px',
      padding: '8px',
      backgroundColor: cssVariableTheme.palette.error.light,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
    },
  },
  render: ({ injector, useDisposable }) => {
    const session = injector.getInstance(SessionService)
    const notyService = injector.getInstance(NotyService)

    const isLoading = useDisposable('isLoading', () => new ObservableValue(false))
    const error = useDisposable('error', () => new ObservableValue<string>(''))

    const handlePasswordReset = async (data: PasswordResetPayload) => {
      isLoading.setValue(true)
      error.setValue('')

      try {
        await session.resetPassword(data.currentPassword, data.newPassword)

        // Clear form by re-rendering
        const form = document.querySelector('form[data-password-reset-form]') as HTMLFormElement
        form?.reset()
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update password'
        error.setValue(errorMessage)
        notyService.emit('onNotyAdded', {
          title: 'Error',
          body: errorMessage,
          type: 'error',
        })
      } finally {
        isLoading.setValue(false)
      }
    }

    return (
      <>
        <Typography variant="h3">🔒 Security</Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Typography variant="h4">Change Password</Typography>

          <Form<PasswordResetPayload>
            validate={isPasswordResetPayload}
            onSubmit={(data) => {
              void handlePasswordReset(data)
            }}
            style={{ maxWidth: '400px' }}
            data-password-reset-form
          >
            <Input
              labelTitle="Current Password"
              name="currentPassword"
              type="password"
              required
              minLength={4}
              style={{ marginBottom: '16px' }}
            />

            <Input
              labelTitle="New Password"
              name="newPassword"
              type="password"
              required
              style={{ marginBottom: '16px' }}
            />

            <Input
              labelTitle="Confirm New Password"
              name="confirmPassword"
              type="password"
              required
              style={{ marginBottom: '16px' }}
            />

            {error.getValue() && <div className="error-message">{error.getValue()}</div>}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading.getValue()}
              style={{ marginTop: '8px' }}
            >
              {isLoading.getValue() ? 'Updating...' : 'Update Password'}
            </Button>
          </Form>
        </Paper>
      </>
    )
  },
})

const ProfileSection = Shade({
  shadowDomName: 'user-settings-profile',
  css: {
    '& h3': {
      marginBottom: '16px',
      color: cssVariableTheme.text.primary,
    },
    '& .field-group': {
      marginBottom: '16px',
    },
    '& .field-label': {
      display: 'block',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontWeight: 'bold',
      marginBottom: '4px',
      color: cssVariableTheme.text.secondary,
    },
    '& .field-value': {
      padding: '8px 12px',
      backgroundColor: cssVariableTheme.background.paper,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      color: cssVariableTheme.text.primary,
    },
  },
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    if (!currentUser) return null

    return (
      <>
        <Typography variant="h3">👤 Profile</Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <div className="field-group">
            <label className="field-label">Username</label>
            <div className="field-value">{currentUser.username}</div>
          </div>

          <div className="field-group">
            <label className="field-label">Roles</label>
            <div className="field-value">{currentUser.roles?.join(', ') || 'No roles assigned'}</div>
          </div>
        </Paper>
      </>
    )
  },
})

export const UserSettingsPage = Shade({
  shadowDomName: 'user-settings-page',
  css: {
    padding: '48px',
    maxWidth: '800px',
    margin: '0 auto',
    '& h1': {
      marginBottom: '32px',
      color: cssVariableTheme.text.primary,
      borderBottom: `2px solid ${cssVariableTheme.palette.primary.main}`,
      paddingBottom: '8px',
    },
  },
  render: () => {
    return (
      <>
        <Typography variant="h1">User Settings</Typography>

        <ProfileSection />
        <SecuritySection />
      </>
    )
  },
})
