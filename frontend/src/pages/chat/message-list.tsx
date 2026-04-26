import { useCollectionSync } from '../../services/entity-sync.js'
import { createComponent, Shade, styledElement } from '@furystack/shades'
import { cssVariableTheme, MarkdownDisplay, Skeleton } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { ChatMessage } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { DeleteChatMessage } from './delete-chat-message.js'

const ChatLine = styledElement('div', {
  fontSize: cssVariableTheme.typography.fontSize.xs,
  display: 'flex',
  flexDirection: 'row',
  gap: '4px',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  width: '100%',
  overflow: 'hidden',
  overflowY: 'auto',
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
  backgroundColor: cssVariableTheme.action.hoverBackground,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: cssVariableTheme.typography.fontSize.lg,
  fontWeight: 'bold',
  color: cssVariableTheme.text.secondary,
  marginRight: '8px',
  flexShrink: '0',
})

export const MessageList = Shade<{ chat: Chat }>({
  customElementName: 'shade-app-message-list',
  css: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  render: (options) => {
    const { props, useRef } = options
    const listRef = useRef<HTMLDivElement>('list')
    setTimeout(() => {
      requestAnimationFrame(() => {
        const el = listRef.current
        if (el) {
          el.scrollTo({
            behavior: 'instant',
            top: Math.max(el.scrollHeight, el.offsetHeight),
          })
        }
      })
    }, 1)

    const { chat } = props

    const chatMessages = useCollectionSync(options, ChatMessage, {
      filter: { chatId: { $eq: chat.id } },
      order: { createdAt: 'ASC' },
    })

    if (chatMessages.status === 'connecting') {
      return (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      )
    }

    if (chatMessages.status === 'error') {
      return <GenericErrorPage error={chatMessages.error} />
    }

    if (chatMessages.data.entries.length === 0) {
      return <div style={{ padding: '16px' }}>No messages yet. Start the conversation!</div>
    }

    return (
      <div
        ref={listRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
          overflowY: 'auto',
          width: '100%',
          height: '100%',
        }}
      >
        {chatMessages.data.entries.map((message) => (
          <ChatLine>
            <ChatLineAvatar />
            <div style={{ width: '100%' }}>
              <ChatLineHeader style={{ position: 'relative', width: '100%' }}>
                <strong>{message.owner}</strong>
                <span style={{ marginLeft: '8px', fontWeight: 'lighter' }}>
                  {new Date(message.createdAt).toLocaleString()}
                </span>
                <DeleteChatMessage chatMessage={message} />
              </ChatLineHeader>
              <div style={{ overflowX: 'auto', width: 'calc(100% - 32px)' }}>
                <MarkdownDisplay content={message.content} />
              </div>
            </div>
          </ChatLine>
        ))}
      </div>
    )
  },
})
