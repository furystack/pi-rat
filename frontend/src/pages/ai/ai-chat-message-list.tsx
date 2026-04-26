import { useCollectionSync } from '../../services/entity-sync.js'
import { createComponent, Shade } from '@furystack/shades'
import { MarkdownDisplay, Paper } from '@furystack/shades-common-components'
import { AiChatMessage } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'

export const AiChatMessageList = Shade<{
  selectedChatId: string
}>({
  customElementName: 'pi-rat-ai-chat-message-list',
  css: {
    display: 'block',
    width: '100%',
    height: 'calc(100% - 124px)',
  },
  render: (options) => {
    const { props, useRef } = options
    const { selectedChatId } = props
    const containerRef = useRef<HTMLDivElement>('container')

    const messagesState = useCollectionSync(options, AiChatMessage, {
      filter: {
        aiChatId: { $eq: selectedChatId },
      },
    })

    const scrollToBottom = (behavior: ScrollBehavior = 'instant') => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          const el = containerRef.current
          if (el) {
            el.scrollTo({
              top: el.scrollHeight,
              behavior,
            })
          }
        })
      }, 1)
    }

    if (messagesState.status === 'connecting') {
      return <div>Loading messages...</div>
    }

    if (messagesState.status === 'error') {
      return <ErrorDisplay error={messagesState.error} />
    }

    scrollToBottom()

    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {messagesState.data.entries.map((message) => {
          try {
            const fromJson = JSON.parse(message.content) as { content: string; thinking?: string }
            const { content, thinking } = fromJson

            return (
              <Paper elevation={1} style={{ padding: '8px', margin: '4px 0' }}>
                <strong>{message.role}</strong>
                {thinking && (
                  <div style={{ opacity: '0.7' }}>
                    <MarkdownDisplay content={thinking} />
                  </div>
                )}
                <div style={{ marginTop: '4px' }}>
                  <MarkdownDisplay content={content} />
                </div>
              </Paper>
            )
          } catch {
            return (
              <Paper elevation={1} style={{ padding: '8px', margin: '4px 0', filter: 'brightness(0.9)' }}>
                <strong>{message.role}</strong>
                <div style={{ marginTop: '4px' }}>
                  <MarkdownDisplay content={message.content} />
                </div>
              </Paper>
            )
          }
        })}
      </div>
    )
  },
})
