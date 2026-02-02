import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { FullScreenLoader } from '../../components/fullscreen-loader.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatService } from './chat-service.js'
import { DeleteChatButton } from './delete-chat-button.js'
import { InviteButton } from './invite-button.js'
import { MessageInput } from './message-input.js'
import { MessageList } from './message-list.js'

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
  render: ({ injector, useSearchState, useObservable }) => {
    const chatService = injector.getInstance(ChatService)
    const [selectedChatId] = useSearchState('selectedChatId', '')

    if (!selectedChatId) {
      return (
        <Paper className="empty-state">
          <h2>Select a chat to start</h2>
        </Paper>
      )
    }

    const [selectedChat] = useObservable(
      `selectedChat-${selectedChatId}`,
      chatService.getChatAsObservable(selectedChatId),
    )

    if (selectedChat.status === 'loading' || selectedChat.status === 'uninitialized') {
      return <FullScreenLoader />
    }

    if (selectedChat.status === 'failed') {
      return <GenericErrorPage error={selectedChat.error} />
    }

    if (selectedChat.status === 'obsolete') {
      void chatService.getChat(selectedChatId)
    }

    return (
      <Paper className="chat-container">
        <h2>{selectedChat.value.name}</h2>
        <h5>{selectedChat.value.description}</h5>
        <div className="chat-actions">
          <DeleteChatButton chat={selectedChat.value} />
          <InviteButton chat={selectedChat.value} />
        </div>
        <div className="messages-container">
          <MessageList
            style={{
              flexGrow: '1',
              overflowY: 'auto',
            }}
            chat={selectedChat.value}
          />
          <MessageInput chat={selectedChat.value} />
        </div>
      </Paper>
    )
  },
})
