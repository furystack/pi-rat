import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, Modal, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Chat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { SessionService } from '../../services/session.js'
import { ChatInvitationService } from './chat-intivation-service.js'

export const InviteButton = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-invite-button',
  render: ({ useDisposable, props, injector }) => {
    const isModalOpen = useDisposable('isModalOpen', () => new ObservableValue(false))

    const currentUser = injector.getInstance(SessionService).currentUser.getValue()

    const invitationService = injector.getInstance(ChatInvitationService)
    const noty = injector.getInstance(NotyService)

    return (
      <>
        <Button onclick={() => isModalOpen.setValue(true)}>Invite</Button>
        <Modal
          backdropStyle={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '1000000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(128,128,128, 0.3)',
            backdropFilter: 'blur(5px)',
          }}
          onClose={() => isModalOpen.setValue(false)}
          isVisible={isModalOpen}
        >
          <Paper onclick={(ev) => ev.stopPropagation()}>
            <Form<{ userName: string; message: string }>
              style={{
                zIndex: '9000',
                display: 'flex',
                flexDirection: 'column',
              }}
              onSubmit={(formData) => {
                invitationService
                  .addChatInvitation({
                    chatId: props.chat.id,
                    userId: formData.userName.trim(),
                    status: 'pending',
                    chatName: props.chat.name,
                    createdAt: new Date(),
                    createdBy: currentUser!.username,
                    id: crypto.randomUUID(),
                    message: formData.message.trim() || '',
                  })
                  .then(() => {
                    isModalOpen.setValue(false)
                    noty.emit('onNotyAdded', {
                      type: 'success',
                      title: '✅ Success',
                      body: `Invitation sent to ${formData.userName.trim()}.`,
                    })
                  })
                  .catch((error) => {
                    noty.emit('onNotyAdded', {
                      type: 'error',
                      title: '❗ Error',
                      body: <ErrorDisplay error={error} />,
                    })
                  })
              }}
              validate={(formData): formData is { userName: string; message: string } => {
                return (
                  'userName' in formData &&
                  typeof (formData as { userName: unknown }).userName === 'string' &&
                  (formData as { userName: string }).userName.trim().length > 0 &&
                  'message' in formData &&
                  typeof (formData as { message: unknown }).message === 'string' &&
                  (formData as { message: string }).message.trim().length <= 500
                )
              }}
            >
              <h2>Invite</h2>
              <div>
                <Input name="userName" labelTitle="Username" placeholder="Enter username to invite" required />
                <Input
                  name="message"
                  labelTitle="Message"
                  placeholder="Enter a message to send with the invitation (optional)"
                />
              </div>

              <div>
                <Button onclick={() => isModalOpen.setValue(false)}>Close</Button>
                <Button type="submit">Invite</Button>
              </div>
            </Form>
          </Paper>
        </Modal>
      </>
    )
  },
})
