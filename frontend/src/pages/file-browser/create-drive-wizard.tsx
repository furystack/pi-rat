import { createComponent, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Button, fadeIn, fadeOut, Input, Modal, NotyService, Wizard } from '@furystack/shades-common-components'
import { WizardStep } from '../../components/wizard-step.js'
import { DrivesService } from '../../services/drives-service.js'
import { getErrorMessage } from '../../services/get-error-message.js'

export type AddDrivePayload = {
  letter: string
  physicalPath: string
}

export const isAddDrivePayload = (data: unknown): data is AddDrivePayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.letter === 'string' &&
    d.letter.length > 0 &&
    typeof d.physicalPath === 'string' &&
    d.physicalPath.length > 0
  )
}

export const AddDriveStep = Shade<WizardStepProps>({
  customElementName: 'add-drive-step',
  render: ({ props, injector }) => {
    return (
      <WizardStep
        title="Add Drive"
        {...props}
        validate={isAddDrivePayload}
        onSubmit={async (data) => {
          try {
            await injector.getInstance(DrivesService).addVolume({
              letter: data.letter,
              physicalPath: data.physicalPath,
            })
            injector.getInstance(NotyService).emit('onNotyAdded', {
              type: 'success',
              body: `Drive '${data.letter}' has been created successfully`,
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
  customElementName: 'create-drive-wizard',
  render: ({ useState, props }) => {
    const [isOpened, setIsOpened] = useState('isOpened', false)
    return (
      <>
        <Modal
          backdropStyle={{ zIndex: '1' }}
          isVisible={isOpened}
          onClose={() => setIsOpened(false)}
          showAnimation={fadeIn}
          hideAnimation={fadeOut}
        >
          <Wizard
            steps={[AddDriveStep]}
            onFinish={() => {
              setIsOpened(false)
              props.onDriveAdded?.()
            }}
          ></Wizard>
        </Modal>
        <Button
          style={{ position: 'fixed', bottom: '1em', right: '1em', zIndex: '1' }}
          variant="outlined"
          color="success"
          onclick={() => setIsOpened(true)}
          title="Add Drive"
        >
          +
        </Button>
      </>
    )
  },
})
