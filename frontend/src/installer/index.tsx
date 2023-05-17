import { createComponent, Shade } from '@furystack/shades'
import { Wizard } from '@furystack/shades-common-components'
import { BubbleBackground } from '../components/bubble-background.js'
import { AllDoneStep } from './all-done-step.js'
import { CreateAdminStep } from './create-admin-step.js'
import { WelcomeStep } from './welcome-step.js'

export const InstallerPage = Shade({
  shadowDomName: 'shade-installer-page',
  render: () => {
    return (
      <BubbleBackground
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          placeContent: 'center',
          position: 'fixed',
        }}>
        <Wizard
          steps={[WelcomeStep, CreateAdminStep, AllDoneStep]}
          onFinish={() => {
            window.location.reload()
          }}
        />
      </BubbleBackground>
    )
  },
})
