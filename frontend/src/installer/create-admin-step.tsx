import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Input } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step.js'
import { InstallApiClient } from '../services/api-clients/install-api-client.js'

export const CreateAdminStep = Shade<WizardStepProps>({
  shadowDomName: 'create-admin-step',
  render: ({ props, injector }) => {
    return (
      <WizardStep
        title="Create the Super Admin user"
        {...props}
        onSubmit={async (ev) => {
          ev.preventDefault()
          const form = ev.target as HTMLFormElement
          const formData = new FormData(form)

          const values = Object.fromEntries(formData.entries()) as { userName: string; password: string }

          await injector.getInstance(InstallApiClient).call({
            method: 'POST',
            action: '/install',
            body: {
              username: values.userName.toString(),
              password: values.password.toString(),
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
        <input type="submit" style={{ display: 'none' }} />
      </WizardStep>
    )
  },
})
