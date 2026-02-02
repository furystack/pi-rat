import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { SessionService } from '../../services/session.js'

type PasswordResetPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const SecuritySection = Shade({
  shadowDomName: 'user-settings-security',
  css: {
    marginTop: '24px',
    '& h3': {
      marginBottom: '16px',
      color: 'var(--theme-text-primary)',
    },
    '& h4': {
      marginBottom: '16px',
      color: 'var(--theme-text-primary)',
    },
    '& .error-message': {
      color: 'var(--theme-error-main)',
      fontSize: '14px',
      marginBottom: '16px',
      padding: '8px',
      backgroundColor: 'var(--theme-error-light)',
      borderRadius: '4px',
    },
  },
  render: ({ injector, useDisposable }) => {
    const session = injector.getInstance(SessionService)
    const notyService = injector.getInstance(NotyService)

    const isLoading = useDisposable('isLoading', () => new ObservableValue(false))
    const error = useDisposable('error', () => new ObservableValue<string>(''))

    const handlePasswordReset = async (data: PasswordResetPayload) => {
      if (data.newPassword !== data.confirmPassword) {
        error.setValue('New passwords do not match')
        return
      }

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
        <h3>🔒 Security</h3>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <h4>Change Password</h4>

          <Form<PasswordResetPayload>
            validate={(data): data is PasswordResetPayload => {
              return !!(
                (data as PasswordResetPayload)?.currentPassword?.length &&
                (data as PasswordResetPayload)?.newPassword?.length &&
                (data as PasswordResetPayload)?.confirmPassword?.length
              )
            }}
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
      color: 'var(--theme-text-primary)',
    },
    '& .field-group': {
      marginBottom: '16px',
    },
    '& .field-label': {
      display: 'block',
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '4px',
      color: 'var(--theme-text-secondary)',
    },
    '& .field-value': {
      padding: '8px 12px',
      backgroundColor: 'var(--theme-background-paper)',
      border: '1px solid var(--theme-border-default)',
      borderRadius: '4px',
      color: 'var(--theme-text-primary)',
    },
  },
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    if (!currentUser) return null

    return (
      <>
        <h3>👤 Profile</h3>

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
      color: 'var(--theme-text-primary)',
      borderBottom: '2px solid var(--theme-primary-main)',
      paddingBottom: '8px',
    },
  },
  render: () => {
    return (
      <>
        <h1>User Settings</h1>

        <ProfileSection />
        <SecuritySection />
      </>
    )
  },
})
