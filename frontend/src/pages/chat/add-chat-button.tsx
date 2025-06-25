import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, Modal, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Chat } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatService } from './chat-service.js'

export const AddChatButton = Shade({
  shadowDomName: 'shade-app-chat-add-chat-button',
  render: ({ useDisposable, injector }) => {
    const isModalOpen = useDisposable('isModalOpen', () => new ObservableValue(false))

    const session = injector.getInstance(SessionService)

    const chats = injector.getInstance(ChatService)

    return (
      <>
        <Button onclick={() => isModalOpen.setValue(true)}>Add Chat</Button>
        <Modal
          isVisible={isModalOpen}
          onClose={() => isModalOpen.setValue(false)}
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
            <Form<Chat>
              onSubmit={(chat: Chat) => {
                chats
                  .addChat({
                    ...chat,
                    id: crypto.randomUUID(),
                    participants: [],
                    createdAt: new Date(),
                    owner: session.currentUser.getValue()?.username || '',
                  })
                  .then(() => {
                    isModalOpen.setValue(false)
                  })
                  .catch((error) => {
                    console.error('Error adding chat:', error)
                  })
              }}
              validate={(_formData): _formData is Chat => {
                return true
              }}
            >
              <Input name="name" labelTitle="Chat Name" placeholder="Enter chat name" required />
              <Input name="description" labelTitle="Description" placeholder="Enter chat description" />

              <Button onclick={() => isModalOpen.setValue(false)}>Close</Button>
              <Button type="submit">Create</Button>
            </Form>
          </Paper>
        </Modal>
      </>
    )
  },
})
