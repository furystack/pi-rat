import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Button, fadeIn, fadeOut, Input, Modal, NotyService, Wizard } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { WizardStep } from '../../components/wizard-step.js'
import { DrivesService } from '../../services/drives-service.js'
import { getErrorMessage } from '../../services/get-error-message.js'

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

          const values = Object.fromEntries(formData.entries()) as { letter: string; physicalPath: string }
          try {
            await injector.getInstance(DrivesService).addVolume({
              letter: values.letter.toString(),
              physicalPath: values.physicalPath.toString(),
            })
            injector.getInstance(NotyService).emit('onNotyAdded', {
              type: 'success',
              body: `Drive '${values.letter.toString()}' has been created succesfully`,
              title: 'Drive created',
            })
          } catch (error) {
            injector.getInstance(NotyService).emit('onNotyAdded', {
              type: 'error',
              title: 'Error during drive creation',
              body: getErrorMessage(error),
            })
          }
        }}
      >
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

export const CreateDriveWizard = Shade<{ onDriveAdded?: () => void }>({
  shadowDomName: 'create-drive-wizard',
  render: ({ useDisposable, props }) => {
    const isOpened = useDisposable('isOpened', () => new ObservableValue(false))
    return (
      <>
        <Modal
          backdropStyle={{ zIndex: '1' }}
          isVisible={isOpened}
          onClose={() => isOpened.setValue(false)}
          showAnimation={fadeIn}
          hideAnimation={fadeOut}
        >
          <Wizard
            steps={[AddDriveStep]}
            onFinish={() => {
              isOpened.setValue(false)
              props.onDriveAdded?.()
            }}
          ></Wizard>
        </Modal>
        <Button
          style={{ position: 'fixed', bottom: '1em', right: '1em', zIndex: '1' }}
          variant="outlined"
          color="success"
          onclick={() => isOpened.setValue(true)}
          title="Add Drive"
        >
          +
        </Button>
      </>
    )
  },
})
