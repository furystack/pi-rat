import { createComponent, Shade } from '@furystack/shades'
import { Button, Paper, Skeleton } from '@furystack/shades-common-components'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatService } from './chat-service.js'

export const ChatList = Shade({
  shadowDomName: 'shade-app-chat-list',
  style: {
    display: 'flex',
  },
  render: ({ injector, useObservable, useSearchState }) => {
    const chatService = injector.getInstance(ChatService)

    const [chatList] = useObservable('chatList', chatService.getChatsAsObservable({}))

    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChatId', '')

    if (chatList.status === 'loading' || chatList.status === 'uninitialized') {
      return (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      )
    }
    if (chatList.status === 'failed') {
      return <GenericErrorPage error={chatList.error} />
    }

    if (chatList.status === 'obsolete') {
      void chatService.getChats({})
    }

    return (
      <Paper style={{ width: '100%', height: 'calc(100% - 28px)' }}>
        <h2>Chat List</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px',
            overflowY: 'auto',
            width: '100%',
          }}
        >
          {chatList.value.entries.map((chat) => (
            <Button
              variant={selectedChatId === chat.id ? 'contained' : 'outlined'}
              onclick={() => setSelectedChatId(chat.id)}
              style={{
                width: '-webkit-fill-available',
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
