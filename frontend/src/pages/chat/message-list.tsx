import { createComponent, Shade } from '@furystack/shades'
import { Skeleton } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatMessageService } from './chat-messages-service.js'

export const MessageList = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-message-list',
  style: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
    width: '100%',
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
          <div style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
            <strong>{message.owner}:</strong>
            <span>{message.content}</span>
          </div>
        ))}
      </>
    )
  },
})
