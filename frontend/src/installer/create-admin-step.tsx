import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Input } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step.js'
import { InstallApiClient } from '../services/api-clients/install-api-client.js'

export type CreateAdminPayload = {
  userName: string
  password: string
  confirmPassword: string
}

export const isCreateAdminPayload = (data: unknown): data is CreateAdminPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.userName === 'string' &&
    d.userName.length > 0 &&
    typeof d.password === 'string' &&
    d.password.length > 0 &&
    typeof d.confirmPassword === 'string' &&
    d.confirmPassword.length > 0 &&
    d.password === d.confirmPassword
  )
}

export const CreateAdminStep = Shade<WizardStepProps>({
  shadowDomName: 'create-admin-step',
  render: ({ props, injector }) => {
    return (
      <WizardStep
        title="Create the Super Admin user"
        {...props}
        validate={isCreateAdminPayload}
        onSubmit={async (data) => {
          await injector.getInstance(InstallApiClient).call({
            method: 'POST',
            action: '/install',
            body: {
              username: data.userName,
              password: data.password,
            },
          })

          props.onNext?.()
        }}
      >
        You have to create a super admin user.
        <Input
          name="userName"
          variant="outlined"
          autofocus
          autocomplete="off"
          labelTitle="E-mail address"
          type="email"
          required
          getHelperText={() => 'Please provide a valid email address'}
        />
        <Input
          name="password"
          variant="outlined"
          type="password"
          labelTitle="Password"
          autocomplete="off"
          minLength={5}
          pattern="[a-zA-Z0-9]{3,}"
          required
          getHelperText={({ state }) => {
            if (!state.validity.valid) {
              return 'Password must be at least 5 characters long and contain at least a lowercase, an uppercase letter and a number'
            }
            return 'Please provide a password with at least 3 characters'
          }}
        />
        <Input
          name="confirmPassword"
          variant="outlined"
          type="password"
          labelTitle="Confirm Password"
          required
          autocomplete="off"
        />
      </WizardStep>
    )
  },
})
