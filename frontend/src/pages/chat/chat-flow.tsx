import { useEntitySync } from '../../services/entity-sync.js'
import { createComponent, Shade } from '@furystack/shades'
import { Paper, Typography } from '@furystack/shades-common-components'
import { Chat } from 'common'
import { FullScreenLoader } from '../../components/fullscreen-loader.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { DeleteChatButton } from './delete-chat-button.js'
import { InviteButton } from './invite-button.js'
import { MessageInput } from './message-input.js'
import { MessageList } from './message-list.js'

export const ChatFlow = Shade({
  customElementName: 'shade-app-chat-flow',
  css: {
    display: 'flex',
    '& .empty-state': {
      flexGrow: '1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
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
  render: (options) => {
    const { useSearchState } = options
    const [selectedChatId] = useSearchState('selectedChatId', '')

    if (!selectedChatId) {
      return (
        <Paper className="empty-state">
          <Typography variant="h2">Select a chat to start</Typography>
        </Paper>
      )
    }

    const chatState = useEntitySync(options, Chat, selectedChatId)

    if (chatState.status === 'connecting') {
      return <FullScreenLoader />
    }

    if (chatState.status === 'error') {
      return <GenericErrorPage error={chatState.error} />
    }

    if (!chatState.data) {
      return <FullScreenLoader />
    }

    const chat = chatState.data

    return (
      <Paper className="chat-container">
        <Typography variant="h2">{chat.name}</Typography>
        <Typography variant="h5">{chat.description}</Typography>
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
