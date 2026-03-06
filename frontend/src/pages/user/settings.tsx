import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Chip,
  cssVariableTheme,
  Form,
  Icon,
  icons,
  Input,
  NotyService,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'
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
    '& .error-message': {
      color: cssVariableTheme.palette.error.main,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      marginBottom: cssVariableTheme.spacing.md,
      padding: cssVariableTheme.spacing.sm,
      backgroundColor: cssVariableTheme.palette.error.light,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
    },
  },
  render: ({ injector, useState }) => {
    const session = injector.getInstance(SessionService)
    const notyService = injector.getInstance(NotyService)

    const [isLoading, setIsLoading] = useState('isLoading', false)
    const [error, setError] = useState('error', '')

    const handlePasswordReset = async (data: PasswordResetPayload) => {
      setIsLoading(true)
      setError('')

      try {
        await session.resetPassword(data.currentPassword, data.newPassword)

        // Clear form by re-rendering
        const form = document.querySelector('form[data-password-reset-form]') as HTMLFormElement
        form?.reset()
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update password'
        setError(errorMessage)
        notyService.emit('onNotyAdded', {
          title: 'Error',
          body: errorMessage,
          type: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Paper elevation={1} style={{ padding: cssVariableTheme.spacing.lg }}>
        <Typography
          variant="h4"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: cssVariableTheme.spacing.sm,
            margin: `0 0 ${cssVariableTheme.spacing.md} 0`,
          }}
        >
          <Icon icon={icons.lock} size="small" /> Security
        </Typography>

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
            variant="outlined"
            placeholder="Enter your current password"
            required
            minLength={4}
            style={{ marginBottom: cssVariableTheme.spacing.md }}
          />

          <Input
            labelTitle="New Password"
            name="newPassword"
            type="password"
            variant="outlined"
            placeholder="Enter a new password"
            required
            style={{ marginBottom: cssVariableTheme.spacing.md }}
          />

          <Input
            labelTitle="Confirm New Password"
            name="confirmPassword"
            type="password"
            variant="outlined"
            placeholder="Re-enter the new password"
            required
            style={{ marginBottom: cssVariableTheme.spacing.md }}
          />

          {error && <div className="error-message">{error}</div>}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            style={{ marginTop: cssVariableTheme.spacing.sm }}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </Form>
      </Paper>
    )
  },
})

const ProfileSection = Shade({
  shadowDomName: 'user-settings-profile',
  css: {
    '& .field-group': {
      marginBottom: cssVariableTheme.spacing.md,
    },
    '& .field-group:last-child': {
      marginBottom: '0',
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
      backgroundColor: cssVariableTheme.background.default,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      color: cssVariableTheme.text.primary,
    },
    '& .roles-list': {
      display: 'flex',
      gap: cssVariableTheme.spacing.sm,
      flexWrap: 'wrap',
    },
  },
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    if (!currentUser) return null

    return (
      <Paper elevation={1} style={{ padding: cssVariableTheme.spacing.lg }}>
        <Typography
          variant="h4"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: cssVariableTheme.spacing.sm,
            margin: `0 0 ${cssVariableTheme.spacing.md} 0`,
          }}
        >
          <Icon icon={icons.user} size="small" /> Profile
        </Typography>

        <div className="field-group">
          <label className="field-label">Username</label>
          <div className="field-value">{currentUser.username}</div>
        </div>

        <div className="field-group">
          <label className="field-label">Roles</label>
          <div className="roles-list">
            {currentUser.roles?.length ? (
              currentUser.roles.map((role) => (
                <Chip variant="outlined" size="small">
                  {role}
                </Chip>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No roles assigned
              </Typography>
            )}
          </div>
        </div>
      </Paper>
    )
  },
})

export const UserSettingsPage = Shade({
  shadowDomName: 'user-settings-page',
  render: () => {
    return (
      <PageContainer gap={cssVariableTheme.spacing.lg}>
        <PageHeader icon={<Icon icon={icons.settings} />} title="User Settings" />
        <ProfileSection />
        <SecuritySection />
      </PageContainer>
    )
  },
})
