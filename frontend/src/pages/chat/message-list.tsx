import { createComponent, Shade, styledElement } from '@furystack/shades'
import { Skeleton } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { marked } from 'marked'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatMessageService } from './chat-messages-service.js'

const ChatLine = styledElement('div', {
  fontSize: '12px',
  display: 'flex',
  flexDirection: 'row',
  gap: '4px',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
})

const ChatLineHeader = styledElement('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  height: '100%',
})

const ChatLineAvatar = styledElement('div', {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: 'bold',
  color: 'rgba(0, 0, 0, 0.7)',
  marginRight: '8px',
})

export const MessageList = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-message-list',
  style: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    overflowY: 'auto',
    width: '100%',
  },
  constructed: ({ element }) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        element.scrollTo({
          behavior: 'smooth',
          top: Math.max(element.scrollHeight, element.offsetHeight),
        })
      })
    }, 1)
  },
  render: ({ injector, props, useObservable }) => {
    const chatMessageService = injector.getInstance(ChatMessageService)

    const { chat } = props

    const [chatMessages] = useObservable(
      `chatMessages-${chat.id}`,
      chatMessageService.getChatMessagesAsObservable({ filter: { chatId: { $eq: chat.id } } }),
    )

    if (chatMessages.status === 'loading' || chatMessages.status === 'uninitialized') {
      return (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      )
    }

    if (chatMessages.status === 'failed') {
      return <GenericErrorPage error={chatMessages.error} />
    }

    if (chatMessages.status === 'obsolete') {
      void chatMessageService.getChatMessages({ filter: { chatId: { $eq: chat.id } } })
    }

    if (chatMessages.value.entries.length === 0) {
      return <div style={{ padding: '16px' }}>No messages yet. Start the conversation!</div>
    }

    return (
      <>
        {chatMessages.value.entries.map((message) => (
          <ChatLine>
            <ChatLineAvatar />

            <div>
              <ChatLineHeader>
                <strong>{message.owner}</strong>
                <span style={{ marginLeft: '8px', fontWeight: 'lighter' }}>
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </ChatLineHeader>
              <div innerHTML={marked(message.content) as string} />
            </div>
          </ChatLine>
        ))}
      </>
    )
  },
})
