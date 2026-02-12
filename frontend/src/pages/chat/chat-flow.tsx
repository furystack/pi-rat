import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { CacheView, Paper } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { FullScreenLoader } from '../../components/fullscreen-loader.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatService } from './chat-service.js'
import { DeleteChatButton } from './delete-chat-button.js'
import { InviteButton } from './invite-button.js'
import { MessageInput } from './message-input.js'
import { MessageList } from './message-list.js'

const ChatFlowContent = Shade<{ data: CacheWithValue<Chat> }>({
  shadowDomName: 'shade-app-chat-flow-content',
  css: {
    '& .chat-container': {
      flexGrow: '1',
      display: 'flex',
      width: 'calc(100% - 62px)',
      flexDirection: 'column',
      height: 'calc(100% - 28px)',
      position: 'relative',
    },
    '& .chat-actions': {
      position: 'absolute',
      top: '8px',
      right: '8px',
    },
    '& .messages-container': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
  },
  render: ({ props }) => {
    const chat = props.data.value
    return (
      <Paper className="chat-container">
        <h2>{chat.name}</h2>
        <h5>{chat.description}</h5>
        <div className="chat-actions">
          <DeleteChatButton chat={chat} />
          <InviteButton chat={chat} />
        </div>
        <div className="messages-container">
          <MessageList
            style={{
              flexGrow: '1',
              overflowY: 'auto',
            }}
            chat={chat}
          />
          <MessageInput chat={chat} />
        </div>
      </Paper>
    )
  },
})

export const ChatFlow = Shade({
  shadowDomName: 'shade-app-chat-flow',
  css: {
    display: 'flex',
    '& .empty-state': {
      flexGrow: '1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  render: ({ injector, useSearchState }) => {
    const chatService = injector.getInstance(ChatService)
    const [selectedChatId] = useSearchState('selectedChatId', '')

    if (!selectedChatId) {
      return (
        <Paper className="empty-state">
          <h2>Select a chat to start</h2>
        </Paper>
      )
    }

    return (
      <CacheView
        cache={chatService.chatCache}
        args={[selectedChatId]}
        content={ChatFlowContent}
        loader={<FullScreenLoader />}
        error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
      />
    )
  },
})
