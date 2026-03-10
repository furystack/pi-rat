import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  cssVariableTheme,
  Form,
  Input,
  Modal,
  NotyService,
  Paper,
  Typography,
} from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { getUser } from '../../utils/session-helpers.js'
import { ChatInvitationService } from './chat-intivation-service.js'

export type InvitePayload = {
  userName: string
  message: string
}

export const isInvitePayload = (data: unknown): data is InvitePayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.userName === 'string' &&
    d.userName.trim().length > 0 &&
    typeof d.message === 'string' &&
    d.message.trim().length <= 500
  )
}

export const InviteButton = Shade<{ chat: Chat }>({
  customElementName: 'shade-app-invite-button',
  render: ({ useState, props, injector }) => {
    const [isModalOpen, setIsModalOpen] = useState('isModalOpen', false)

    const invitationService = injector.getInstance(ChatInvitationService)
    const noty = injector.getInstance(NotyService)

    return (
      <>
        <Button onclick={() => setIsModalOpen(true)}>Invite</Button>
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
            background: cssVariableTheme.action.backdrop,
            backdropFilter: `blur(${cssVariableTheme.effects.blurMd})`,
          }}
          onClose={() => setIsModalOpen(false)}
          isVisible={isModalOpen}
        >
          <Paper onclick={(ev) => ev.stopPropagation()}>
            <Form<InvitePayload>
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
                    createdBy: getUser(injector).username,
                    id: crypto.randomUUID(),
                    message: formData.message.trim() || '',
                  })
                  .then(() => {
                    setIsModalOpen(false)
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
              validate={isInvitePayload}
            >
              <Typography variant="h2">Invite</Typography>
              <div>
                <Input name="userName" labelTitle="Username" placeholder="Enter username to invite" required />
                <Input
                  name="message"
                  labelTitle="Message"
                  placeholder="Enter a message to send with the invitation (optional)"
                />
              </div>

              <div>
                <Button onclick={() => setIsModalOpen(false)}>Close</Button>
                <Button type="submit">Invite</Button>
              </div>
            </Form>
          </Paper>
        </Modal>
      </>
    )
  },
})
