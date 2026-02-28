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
import type { AiChat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { SessionService } from '../../services/session.js'
import { AiChatService } from './ai-chat-service.js'
import { AiModelSelector } from './ai-model-selector.js'

export type CreateAiChatPayload = Pick<AiChat, 'name' | 'description' | 'model'>

export const isCreateAiChatPayload = (data: unknown): data is CreateAiChatPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.name === 'string' &&
    d.name.trim() !== '' &&
    (typeof d.description === 'string' || d.description === undefined) &&
    typeof d.model === 'string' &&
    d.model.trim() !== ''
  )
}

export const CreateAiChatButton = Shade({
  shadowDomName: 'pi-rat-create-ai-chat-button',
  render: ({ injector, useState }) => {
    const aiChatService = injector.getInstance(AiChatService)
    const [isModalOpen, setIsModalOpen] = useState('isModalOpen', false)
    const session = injector.getInstance(SessionService)

    const noty = injector.getInstance(NotyService)

    return (
      <>
        <Button
          style={{ padding: '8px 16px', cursor: 'pointer' }}
          onclick={() => {
            setIsModalOpen(true)
          }}
        >
          ➕ New AI Chat
        </Button>
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
            background: cssVariableTheme.action.backdrop,
            backdropFilter: `blur(${cssVariableTheme.effects.blurMd})`,
          }}
        >
          <Paper onclick={(ev) => ev.stopPropagation()}>
            <Typography variant="h2">Create New AI Chat</Typography>
            <Form<CreateAiChatPayload>
              onSubmit={(chat) => {
                aiChatService
                  .createChat({
                    ...chat,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    owner: session.currentUser.getValue()!.username,
                    status: 'active',
                    visibility: 'private',
                    description: chat.description,
                    model: chat.model,
                    name: chat.name.trim(),
                  })
                  .then(() => {
                    setIsModalOpen(false)
                    noty.emit('onNotyAdded', {
                      type: 'success',
                      body: `AI chat "${chat.name}" created successfully!`,
                      title: 'AI Chat Created',
                    })
                  })
                  .catch((error) => {
                    console.error('Error creating AI chat:', error)
                    noty.emit('onNotyAdded', {
                      type: 'error',
                      body: (
                        <>
                          Failed to create AI chat <br />
                          <ErrorDisplay error={error} />
                        </>
                      ),
                      title: 'AI Chat Creation Failed',
                    })
                  })
              }}
              validate={isCreateAiChatPayload}
            >
              Select model:
              <AiModelSelector />
              <Input
                name="name"
                labelTitle="Chat Name"
                placeholder="Enter chat name"
                required
                style={{ width: '100%', padding: '8px', margin: '8px 0' }}
              />
              <Input
                name="description"
                labelTitle="Description"
                placeholder="Enter chat description"
                style={{ width: '100%', padding: '8px', margin: '8px 0' }}
              />
              <Button type="submit">Create</Button>
            </Form>
          </Paper>
        </Modal>
      </>
    )
  },
})
