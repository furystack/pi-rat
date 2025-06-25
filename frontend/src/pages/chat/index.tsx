import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { WebsocketNotificationsService } from '../../services/websocket-events.js'
import { AddChatButton } from './add-chat-button.js'
import { ChatFlow } from './chat-flow.js'
import { ChatInvitationList } from './chat-invitation-list.js'
import { ChatList } from './chat-list.js'
import { SpeechRecognitionService } from './speech-recognition-service.js'
import { SpeechSynthesisService } from './speech-synthesis-service.js'

export const ChatPage = Shade({
  shadowDomName: 'shade-app-chat-page',
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
  render: ({ injector }) => {
    const speechSynthesis = injector.getInstance(SpeechSynthesisService)

    const speechRecognizer = injector.getInstance(SpeechRecognitionService)

    injector.getInstance(WebsocketNotificationsService)

    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexGrow: '0',
            width: '100%',
          }}
        >
          <h1 style={{ margin: '0', marginLeft: '16px' }}>Chat Page</h1>
          <div>
            <Button
              onclick={async () => {
                const result = await speechRecognizer.recognizeSpeech()
                speechSynthesis.speak(`Azt mondtad: ${result}`)
                console.log('Recognized speech:', result)
              }}
            >
              🎤 Speak
            </Button>
            <AddChatButton />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            flexGrow: '1',
            overflow: 'hidden',
            height: '100%',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: '0',
              minWidth: '250px',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <ChatList
              style={{
                height: '100%',
                width: '100%',
              }}
            />
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
