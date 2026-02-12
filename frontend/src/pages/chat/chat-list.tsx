import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, Paper, Skeleton } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatService } from './chat-service.js'

const ChatListContent = Shade<{ data: CacheWithValue<GetCollectionResult<Chat>> }>({
  shadowDomName: 'shade-app-chat-list-content',
  render: ({ props, useSearchState }) => {
    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChatId', '')

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
          {props.data.value.entries.map((chat) => (
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

export const ChatList = Shade({
  shadowDomName: 'shade-app-chat-list',
  style: {
    display: 'flex',
  },
  render: ({ injector }) => {
    const chatService = injector.getInstance(ChatService)
    return (
      <CacheView
        cache={chatService.chatQueryCache}
        args={[{}]}
        content={ChatListContent}
        loader={
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        }
        error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
      />
    )
  },
})
