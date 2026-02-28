import { createComponent, Shade } from '@furystack/shades'
import { Paper, Typography } from '@furystack/shades-common-components'
import { AiChatList } from './ai-chat-list.js'
import { AiChat } from './ai-chat.js'
import { CreateAiChatButton } from './create-ai-chat-button.js'

export const AiPage = Shade({
  shadowDomName: 'pi-rat-ai-page',
  css: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '100%',
    height: 'calc(100% - 48px)',
    gap: '16px',
    overflow: 'hidden',
    '& .ai-container': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    },
    '& .ai-header': {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: '1',
      flex: '5',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    '& .ai-body': {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      overflow: 'hidden',
      flexGrow: '1',
    },
  },
  render: ({ useSearchState }) => {
    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChat', '')

    return (
      <div className="ai-container">
        <Paper style={{ display: 'flex', flexDirection: 'row', width: 'calc(100% - 48px)', flexGrow: '0' }}>
          <div className="ai-header">
            <Typography variant="h1">AI Chats</Typography>
            <CreateAiChatButton />
          </div>
        </Paper>
        <div className="ai-body">
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
