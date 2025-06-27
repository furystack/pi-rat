import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { marked } from 'marked'
import { ErrorDisplay } from '../../components/error-display.js'
import { WebsocketNotificationsService } from '../../services/websocket-events.js'
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
  render: ({ useObservable, injector, props, element, useDisposable }) => {
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

    const wsService = injector.getInstance(WebsocketNotificationsService)

    useDisposable('webSocketSubscription', () =>
      wsService.subscribe('onMessage', async (message) => {
        if (message.type !== 'ai-chat-message-added') {
          return
        }
        if (message.aiChatMessage.aiChatId !== selectedChatId) {
          return
        }
        scrollToBottom('smooth')
      }),
    )

    const scrollToBottom = (behavior: ScrollBehavior = 'instant') => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior,
          })
        })
      }, 1)
    }

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

    scrollToBottom()

    return (
      <>
        {messages.value.result.entries.map((message) => {
          const innerHTML = marked.parse(message.content)

          return (
            <Paper elevation={1} style={{ padding: '8px', margin: '4px 0', filter: 'brightness(0.9)' }}>
              <strong>{message.role}</strong>
              <div style={{ marginTop: '4px' }} innerHTML={innerHTML as string} />
            </Paper>
          )
        })}
      </>
    )
  },
})
