import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { AiChatList } from './ai-chat-list.js'
import { AiChat } from './ai-chat.js'
import { CreateAiChatButton } from './create-ai-chat-button.js'

export const AiPage = Shade({
  shadowDomName: 'pi-rat-ai-page',
  style: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '100%',
    height: 'calc(100% - 48px)',
    gap: '16px',
    overflow: 'hidden',
  },
  render: ({ useSearchState }) => {
    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChat', '')

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: '1',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Paper style={{ display: 'flex', flexDirection: 'row', width: 'calc(100% - 48px)', flexGrow: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: '1', flex: '5' }}>
            <h1>AI Chats</h1>
            <CreateAiChatButton />
          </div>
        </Paper>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            overflow: 'hidden',
            flexGrow: '1',
          }}
        >
          <AiChatList
            style={{ height: '100%', minWidth: '250px' }}
            onSelect={({ id }) => setSelectedChatId(id)}
            selectedChatId={selectedChatId}
          />
          <AiChat selectedChatId={selectedChatId} />
        </div>
      </div>
    )
  },
})
