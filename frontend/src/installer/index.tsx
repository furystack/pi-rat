import { createComponent, Shade } from '@furystack/shades'
import { Input, Wizard, WizardStepProps } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step'

const WelcomeStep = Shade<WizardStepProps>({
  shadowDomName: 'welcome-step',
  render: ({ props }) => {
    return (
      <WizardStep title="Welcome to PI-RAT Installer" {...props}>
        It seems that PI-RAT is not ready yet. Please follow the instructions to setup PI-RAT.
      </WizardStep>
    )
  },
})

const CreateAdminStep = Shade<WizardStepProps>({
  shadowDomName: 'create-admin-step',
  render: ({ props }) => {
    return (
      <WizardStep title="Create the Super Admin user" {...props}>
        You have to create a super admin user.
        <Input
          variant="outlined"
          autofocus
          autocomplete="false"
          labelTitle="E-mail address"
          type="email"
          required
          getHelperText={() => 'Please provide a valid email address'}
        />
        <Input
          variant="outlined"
          type="password"
          labelTitle="Password"
          autocomplete="false"
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
        <Input variant="outlined" type="password" labelTitle="Confirm Password" required autocomplete="false" />
        <input type="submit" style={{ display: 'none' }} />
      </WizardStep>
    )
  },
})

export const InstallerPage = Shade({
  shadowDomName: 'shade-installer-page',
  render: () => {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', placeContent: 'center', position: 'fixed' }}>
        <Wizard
          isOpened
          steps={[WelcomeStep, CreateAdminStep]}
          onFinish={() => {
            window.location.reload()
          }}
        />
      </div>
    )
  },
})
