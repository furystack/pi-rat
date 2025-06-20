import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { FullScreenLoader } from '../../components/fullscreen-loader.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatService } from './chat-service.js'
import { DeleteChatButton } from './delete-chat-button.js'
import { MessageInput } from './message-input.js'
import { MessageList } from './message-list.js'

export const ChatFlow = Shade({
  shadowDomName: 'shade-app-chat-flow',
  style: {
    display: 'flex',
  },
  render: ({ injector, useSearchState, useObservable }) => {
    const chatService = injector.getInstance(ChatService)
    const [selectedChatId] = useSearchState('selectedChatId', '')

    if (!selectedChatId) {
      return (
        <Paper
          style={{
            flexGrow: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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
      <Paper
        style={{
          flexGrow: '1',
          display: 'flex',
          width: 'calc(100% - 62px)',
          flexDirection: 'column',
          height: 'calc(100% - 28px)',
          position: 'relative',
        }}
      >
        <h2>{selectedChat.value.name}</h2>
        <h5>{selectedChat.value.description}</h5>
        <DeleteChatButton
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
          }}
          chat={selectedChat.value}
        />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
