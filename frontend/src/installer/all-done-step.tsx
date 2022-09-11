import { createComponent, Shade } from '@furystack/shades'
import { WizardStepProps } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step'
import '@furystack/shades-lottie'
import done from './done.json'

export const AllDoneStep = Shade<WizardStepProps>({
  shadowDomName: 'all-done-step',
  render: ({ props }) => {
    return (
      <WizardStep title="Welcome to PI-RAT Installer" {...props}>
        <lottie-player src={done} />
        All done!
      </WizardStep>
    )
  },
})
