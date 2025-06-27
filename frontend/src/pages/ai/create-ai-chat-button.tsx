import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, Modal, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { AiChat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { SessionService } from '../../services/session.js'
import { AiChatService } from './ai-chat-service.js'
import { AiModelSelector } from './ai-model-selector.js'

export const CreateAiChatButton = Shade({
  shadowDomName: 'pi-rat-create-ai-chat-button',
  render: ({ injector, useDisposable }) => {
    const aiChatService = injector.getInstance(AiChatService)
    const isModalOpen = useDisposable('isModalOpen', () => new ObservableValue(false))
    const session = injector.getInstance(SessionService)

    const noty = injector.getInstance(NotyService)

    return (
      <>
        <button
          style={{ padding: '8px 16px', cursor: 'pointer' }}
          onclick={() => {
            isModalOpen.setValue(true)
          }}
        >
          ➕ New AI Chat
        </button>
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
            <h2>Create New AI Chat</h2>
            <Form<Pick<AiChat, 'name' | 'description' | 'model'>>
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
                    isModalOpen.setValue(false)
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
              validate={(formData): formData is Pick<AiChat, 'name' | 'description' | 'model'> => {
                return (
                  'name' in formData &&
                  typeof (formData as AiChat).name === 'string' &&
                  (formData as AiChat).name.trim() !== '' &&
                  'description' in formData &&
                  (typeof (formData as AiChat).description === 'string' ||
                    (formData as AiChat).description === undefined) &&
                  'model' in formData &&
                  typeof (formData as AiChat).model === 'string' &&
                  (formData as AiChat).model.trim() !== ''
                )
              }}
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
