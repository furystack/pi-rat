import { createComponent, createFragment, Shade } from '@furystack/shades'
import { Button, fadeIn, fadeOut, Input, Modal, Wizard, WizardStepProps } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { NotyService } from '@furystack/shades-common-components'
import { WizardStep } from '../../components/wizard-step'
import { PiratApiClient } from '../../services/pirat-api-client'

export const AddDriveStep = Shade<WizardStepProps>({
  shadowDomName: 'add-drive-step',
  render: ({ props, injector }) => {
    return (
      <WizardStep
        title="Add Drive"
        {...props}
        onSubmit={async (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          const form = ev.target as HTMLFormElement
          const formData = new FormData(form)

          const values = Object.fromEntries(formData.entries())
          try {
            await injector.getInstance(PiratApiClient).call({
              method: 'POST',
              action: '/drives',
              body: {
                letter: values.letter.toString(),
                physicalPath: values.physicalPath.toString(),
              },
            })
            await props.onNext?.()
            injector.getInstance(NotyService).addNoty({
              type: 'success',
              body: `Drive '${values.letter.toString()}' has been succesfully`,
              title: 'Drive created',
            })
          } catch (error) {
            injector
              .getInstance(NotyService)
              .addNoty({ type: 'error', title: 'Error during drive creation', body: (error as any).toString() })
          }
        }}>
        <div style={{ padding: '1em 0' }}>
          <Input
            required
            variant="outlined"
            name="letter"
            labelTitle={'Letter'}
            getHelperText={({ state }) => {
              if (!state.validity.valid) {
                return 'Please provide a valid drive letter'
              }
              return 'Please provide a drive letter'
            }}
          />
          <Input
            name="physicalPath"
            required
            variant="outlined"
            labelTitle="Physical path"
            getHelperText={() => 'Provide an accessible path on the host'}
          />
        </div>
      </WizardStep>
    )
  },
})

export const CreateDriveWizard = Shade<{ onDriveAdded: () => void }, { isOpened: ObservableValue<boolean> }>({
  shadowDomName: 'create-drive-wizard',
  getInitialState: () => ({ isOpened: new ObservableValue(false) }),
  constructed: ({ getState }) => {
    return () => getState().isOpened.dispose()
  },
  render: ({ getState, props }) => {
    const { isOpened } = getState()
    return (
      <>
        <Modal
          backdropStyle={{ zIndex: '1' }}
          isVisible={isOpened}
          onClose={() => isOpened.setValue(false)}
          showAnimation={fadeIn}
          hideAnimation={fadeOut}>
          <Wizard
            steps={[AddDriveStep]}
            onFinish={() => {
              isOpened.setValue(false)
              props.onDriveAdded()
            }}></Wizard>
        </Modal>
        <Button
          style={{ position: 'fixed', bottom: '1em', right: '1em', zIndex: '1' }}
          variant="outlined"
          color="success"
          onclick={() => isOpened.setValue(true)}
          title="Add Drive">
          +
        </Button>
      </>
    )
  },
})
