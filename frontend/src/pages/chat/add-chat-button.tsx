import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, Modal, Paper } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'
import { ChatService } from './chat-service.js'

export type AddChatPayload = {
  name: string
  description?: string
}

export const isAddChatPayload = (data: unknown): data is AddChatPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.name === 'string' &&
    d.name.length > 0 &&
    (d.description === undefined || typeof d.description === 'string')
  )
}

export const AddChatButton = Shade({
  shadowDomName: 'shade-app-chat-add-chat-button',
  render: ({ useState, injector }) => {
    const [isModalOpen, setIsModalOpen] = useState('isModalOpen', false)

    const session = injector.getInstance(SessionService)

    const chats = injector.getInstance(ChatService)

    return (
      <>
        <Button onclick={() => setIsModalOpen(true)}>Add Chat</Button>
        <Modal
          isVisible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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
        >
          <Paper onclick={(ev) => ev.stopPropagation()}>
            <h2>Add New Chat</h2>
            <Form<AddChatPayload>
              validate={isAddChatPayload}
              onSubmit={(chatData) => {
                chats
                  .addChat({
                    ...chatData,
                    id: crypto.randomUUID(),
                    participants: [],
                    createdAt: new Date(),
                    owner: session.currentUser.getValue()?.username || '',
                  })
                  .then(() => {
                    setIsModalOpen(false)
                  })
                  .catch((error) => {
                    console.error('Error adding chat:', error)
                  })
              }}
            >
              <Input name="name" labelTitle="Chat Name" placeholder="Enter chat name" required />
              <Input name="description" labelTitle="Description" placeholder="Enter chat description" />

              <Button onclick={() => setIsModalOpen(false)}>Close</Button>
              <Button type="submit">Create</Button>
            </Form>
          </Paper>
        </Modal>
      </>
    )
  },
})
