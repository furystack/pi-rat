import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, Paper, Skeleton, Typography } from '@furystack/shades-common-components'
import type { AiChat } from 'common'
import { ErrorDisplay } from '../../components/error-display.js'
import { AiChatService } from './ai-chat-service.js'

const AiChatListContent = Shade<{
  data: CacheWithValue<GetCollectionResult<AiChat>>
  selectedChatId?: string
  onSelect: (chat: AiChat) => void
}>({
  customElementName: 'pi-rat-ai-chat-list-content',
  render: ({ props }) => {
    return (
      <Paper style={{ padding: '16px', height: 'calc(100% - 48px)' }}>
        <Typography variant="h3">Chats</Typography>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {props.data.value.entries.map((chat) => (
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

export const AiChatList = Shade<{ selectedChatId?: string; onSelect: (chat: AiChat) => void }>({
  customElementName: 'pi-rat-ai-chat-list',
  render: ({ injector, props }) => {
    const aiChatService = injector.getInstance(AiChatService)

    return (
      <CacheView
        cache={aiChatService.aiChatQueryCache}
        args={[{}]}
        content={AiChatListContent}
        contentProps={{ selectedChatId: props.selectedChatId, onSelect: props.onSelect }}
        loader={<Skeleton />}
        error={(err) => <ErrorDisplay error={err} />}
      />
    )
  },
})
