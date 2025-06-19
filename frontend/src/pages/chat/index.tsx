import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { AddChatButton } from './add-chat-button.js'
import { ChatFlow } from './chat-flow.js'
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
    height: 'calc(100% - 48px)',
    gap: '16px',
  },
  render: ({ injector }) => {
    const speechSynthesis = injector.getInstance(SpeechSynthesisService)

    const speechRecognizer = injector.getInstance(SpeechRecognitionService)

    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexGrow: '0',
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
          }}
        >
          <ChatList
            style={{
              height: '100%',
            }}
          />
          <ChatFlow
            style={{
              flexGrow: '1',
              height: '100%',
            }}
          />
        </div>
      </>
    )
  },
})
