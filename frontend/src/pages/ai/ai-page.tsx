import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Button, cssVariableTheme, Icon, icons, Paper, Typography } from '@furystack/shades-common-components'

import { AiChatList } from './ai-chat-list.js'
import { AiChat } from './ai-chat.js'
import { CreateAiChatButton } from './create-ai-chat-button.js'

export const AiPage = Shade({
  shadowDomName: 'pi-rat-ai-page',
  css: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    gap: cssVariableTheme.spacing.md,
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
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `0 ${cssVariableTheme.spacing.md}`,
    },
    '& .ai-header-left': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
    },
    '& .ai-body': {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      overflow: 'hidden',
      flexGrow: '1',
    },
    '& .ai-sidebar': {
      flexShrink: '0',
      width: '280px',
    },
    '& .ai-sidebar.hidden': {
      display: 'none',
    },
  },
  render: ({ injector, useSearchState, useObservable, useState }) => {
    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChat', '')
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)
    const [isSidebarOpen, setSidebarOpen] = useState('sidebarOpen', true)

    const showSidebar = isDesktop || isSidebarOpen

    return (
      <div className="ai-container">
        <Paper>
          <div className="ai-header">
            <div className="ai-header-left">
              {!isDesktop ? (
                <Button variant="outlined" onclick={() => setSidebarOpen(!isSidebarOpen)}>
                  <Icon icon={icons.menu} size="small" />
                </Button>
              ) : null}
              <Typography variant="h1">AI Chats</Typography>
            </div>
            <CreateAiChatButton />
          </div>
        </Paper>
        <div className="ai-body">
          <div className={`ai-sidebar${showSidebar ? '' : ' hidden'}`}>
            <AiChatList
              style={{ height: '100%', width: '100%' }}
              onSelect={({ id }) => setSelectedChatId(id)}
              selectedChatId={selectedChatId}
            />
          </div>
          <AiChat selectedChatId={selectedChatId} />
        </div>
      </div>
    )
  },
})
