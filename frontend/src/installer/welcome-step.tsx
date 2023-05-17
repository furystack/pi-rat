import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { WizardStep } from '../components/wizard-step.js'
import '@furystack/shades-lottie'
import welcome from './welcome.json'

export const WelcomeStep = Shade<WizardStepProps>({
  shadowDomName: 'welcome-step',
  render: ({ props }) => {
    return (
      <WizardStep title="Welcome to PI-RAT Installer" {...props}>
        <lottie-player style={{ height: '128px' }} src={JSON.stringify(welcome)} autoplay loop />
        It seems that PI-RAT is not ready yet. Please follow the instructions to setup PI-RAT.
      </WizardStep>
    )
  },
})
