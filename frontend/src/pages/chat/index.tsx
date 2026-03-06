import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Button, cssVariableTheme, Icon, icons, Typography } from '@furystack/shades-common-components'

import { WebsocketNotificationsService } from '../../services/websocket-events.js'
import { AddChatButton } from './add-chat-button.js'
import { ChatFlow } from './chat-flow.js'
import { ChatInvitationList } from './chat-invitation-list.js'
import { ChatList } from './chat-list.js'
import { SpeechRecognitionService } from './speech-recognition-service.js'
import { SpeechSynthesisService } from './speech-synthesis-service.js'

export const ChatPage = Shade({
  shadowDomName: 'shade-app-chat-page',
  css: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    gap: cssVariableTheme.spacing.md,
    overflow: 'hidden',
    '& .chat-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      flexGrow: '0',
      width: '100%',
      padding: `0 ${cssVariableTheme.spacing.md}`,
    },
    '& .chat-header h1': {
      margin: '0',
    },
    '& .chat-header-actions': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.xs,
    },
    '& .chat-body': {
      display: 'flex',
      flexDirection: 'row',
      gap: cssVariableTheme.spacing.sm,
      flexGrow: '1',
      overflow: 'hidden',
      height: '100%',
      width: '100%',
    },
    '& .chat-sidebar': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '0',
      flexShrink: '0',
      width: '280px',
      height: '100%',
      overflow: 'hidden',
    },
    '& .chat-sidebar.hidden': {
      display: 'none',
    },
  },
  render: ({ injector, useObservable, useState }) => {
    const speechSynthesis = injector.getInstance(SpeechSynthesisService)
    const speechRecognizer = injector.getInstance(SpeechRecognitionService)
    injector.getInstance(WebsocketNotificationsService)

    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)
    const [isSidebarOpen, setSidebarOpen] = useState('sidebarOpen', true)

    const showSidebar = isDesktop || isSidebarOpen

    return (
      <>
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: cssVariableTheme.spacing.sm }}>
            {!isDesktop ? (
              <Button variant="outlined" onclick={() => setSidebarOpen(!isSidebarOpen)}>
                <Icon icon={icons.menu} size="small" />
              </Button>
            ) : null}
            <Typography variant="h1">Chat</Typography>
          </div>
          <div className="chat-header-actions">
            <Button
              onclick={async () => {
                const result = await speechRecognizer.recognizeSpeech()
                speechSynthesis.speak(`Azt mondtad: ${result}`)
              }}
            >
              🎤
            </Button>
            <AddChatButton />
          </div>
        </div>
        <div className="chat-body">
          <div className={`chat-sidebar${showSidebar ? '' : ' hidden'}`}>
            <ChatList style={{ height: '100%', width: '100%' }} />
            <ChatInvitationList />
          </div>
          <ChatFlow
            style={{
              flexGrow: '1',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
            }}
          />
        </div>
      </>
    )
  },
})
