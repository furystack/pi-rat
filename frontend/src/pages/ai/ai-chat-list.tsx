import { createComponent, Shade } from '@furystack/shades'
import { Button, Paper } from '@furystack/shades-common-components'
import type { AiChat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { AiChatService } from './ai-chat-service.js'

export const AiChatList = Shade<{ selectedChatId?: string; onSelect: (chat: AiChat) => void }>({
  shadowDomName: 'pi-rat-ai-chat-list',
  render: ({ injector, useObservable, props }) => {
    const aiChatService = injector.getInstance(AiChatService)

    const [chatList] = useObservable('chatList', aiChatService.getChatAsObservable({}))

    if (chatList.status === 'loading' || chatList.status === 'uninitialized') {
      return <div>Loading...</div>
    }
    if (chatList.status === 'failed') {
      return <ErrorDisplay error={chatList.error} />
    }

    if (chatList.status === 'obsolete') {
      void aiChatService.chat({})
    }

    return (
      <Paper style={{ padding: '16px', height: 'calc(100% - 48px)' }}>
        <h3>Chats</h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {chatList.value.result.entries.map((chat) => (
            <Button
              variant={props.selectedChatId === chat.id ? 'contained' : undefined}
              onclick={() => {
                props.onSelect(chat)
              }}
            >
              {chat.name}
            </Button>
          ))}
        </div>
      </Paper>
    )
  },
})
