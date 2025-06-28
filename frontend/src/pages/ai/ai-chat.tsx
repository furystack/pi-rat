import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService, Paper } from '@furystack/shades-common-components'
import { ErrorDisplay } from '../../components/error-display.js'
import { AiChatInput } from './ai-chat-input.js'
import { AiChatMessageList } from './ai-chat-message-list.js'
import { AiChatService } from './ai-chat-service.js'

export const AiChat = Shade<{ selectedChatId: string }>({
  shadowDomName: 'pi-rat-ai-chat',
  style: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  render: ({ props, useObservable, injector }) => {
    const { selectedChatId } = props
    const chatService = injector.getInstance(AiChatService)
    const [chat] = useObservable('chat', chatService.getAiChatAsObservable(selectedChatId))

    const noty = injector.getInstance(NotyService)

    return (
      <Paper style={{ padding: '16px', flexGrow: '1' }}>
        <h3>
          {chat.value?.name}
          <Button
            title="Delete Chat"
            onclick={() => {
              if (confirm(`Are you sure you want to delete the chat "${chat.value?.name}"?`)) {
                chatService
                  .removeChat(selectedChatId)
                  .then(() => {
                    noty.emit('onNotyAdded', {
                      type: 'success',
                      body: `Chat "${chat.value?.name}" deleted successfully.`,
                      title: 'Chat Deleted',
                    })
                  })
                  .catch((error) => {
                    noty.emit('onNotyAdded', {
                      type: 'error',
                      body: (
                        <>
                          Failed to delete chat "{chat.value?.name}": <ErrorDisplay error={error} />
                        </>
                      ),
                      title: 'Deletion Failed',
                    })
                  })
              }
            }}
          >
            🗑️
          </Button>
        </h3>
        <AiChatMessageList selectedChatId={selectedChatId} />
        <AiChatInput selectedChatId={selectedChatId} />
      </Paper>
    )
  },
})
