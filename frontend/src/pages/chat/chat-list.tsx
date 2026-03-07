import { useCollectionSync } from '@furystack/entity-sync-client'
import { createComponent, Shade } from '@furystack/shades'
import { Button, Paper, Skeleton, Typography } from '@furystack/shades-common-components'
import { Chat } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'

export const ChatList = Shade({
  customElementName: 'shade-app-chat-list',
  style: {
    display: 'flex',
  },
  render: (options) => {
    const { useSearchState } = options
    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChatId', '')

    const chatsState = useCollectionSync(options, Chat, {})

    if (chatsState.status === 'connecting') {
      return (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      )
    }

    if (chatsState.status === 'error') {
      return <GenericErrorPage error={chatsState.error} />
    }

    return (
      <Paper style={{ width: '100%', height: 'calc(100% - 28px)' }}>
        <Typography variant="h2">Chat List</Typography>
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
          {chatsState.data.entries.map((chat) => (
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
