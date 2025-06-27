import { createComponent, Shade } from '@furystack/shades'
import { marked } from 'marked'
import { ErrorDisplay } from '../../components/error-display.js'
import { AiChatMessageService } from './ai-chat-message-service.js'

export const AiChatMessageList = Shade<{
  selectedChatId: string
}>({
  shadowDomName: 'pi-rat-ai-chat-message-list',
  style: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100% - 32px)',
    overflowY: 'auto',
  },
  render: ({ useObservable, injector, props }) => {
    const { selectedChatId } = props
    const aiChatService = injector.getInstance(AiChatMessageService)

    const [messages] = useObservable(
      'messages',
      aiChatService.getChatMessagesAsObservable({
        filter: {
          aiChatId: { $eq: selectedChatId },
        },
      }),
    )

    if (!messages?.value) {
      return <div>Loading messages...</div>
    }

    if (messages.status === 'failed') {
      return <ErrorDisplay error={messages.error} />
    }

    if (messages.status === 'obsolete') {
      void aiChatService.getChatMessages({
        filter: {
          aiChatId: { $eq: selectedChatId },
        },
      })
    }

    return (
      <>
        {messages.value.result.entries.map((message) => {
          const innerHTML = marked.parse(message.content)

          return (
            <div
              style={{
                padding: '8px',
                borderBottom: '1px solid #ccc',
              }}
            >
              <strong>{message.role}</strong>
              <div style={{ marginTop: '4px' }} innerHTML={innerHTML as string} />
            </div>
          )
        })}
      </>
    )
  },
})
