import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step'
import '@furystack/shades-lottie'
import done from './done.json'

export const AllDoneStep = Shade<WizardStepProps>({
  shadowDomName: 'all-done-step',
  render: ({ props }) => {
    return (
      <WizardStep title="Welcome to PI-RAT Installer" {...props}>
        <lottie-player src={JSON.stringify(done)} style={{ height: '128px' }} autoplay />
        <h3>All done!</h3>
        <p>Please finish the setup and log in with your fancy new admin account!</p>
      </WizardStep>
    )
  },
})
