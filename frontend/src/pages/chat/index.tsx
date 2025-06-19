import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { SpeechRecognitionService } from './speech-recognition-service.js'
import { SpeechSynthesisService } from './speech-synthesis-service.js'

export const ChatPage = Shade({
  shadowDomName: 'shade-app-chat-page',
  style: {
    marginTop: '64px',
    display: 'flex',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  render: ({ injector }) => {
    const speechSynthesis = injector.getInstance(SpeechSynthesisService)

    const speechRecognizer = injector.getInstance(SpeechRecognitionService)

    return (
      <div>
        <h1>Chat Page</h1>
        <p>This is the chat page where users can interact with each other.</p>
        <Button
          onclick={() =>
            speechSynthesis.speak(
              'Továbbra is gondoskodunk gépjárműve biztosítási védelméről. Amennyiben elégedett a szolgáltatásunkkal, Önnek nincs teendője.',
            )
          }
        >
          💬 Speak
        </Button>

        <Button
          onclick={async () => {
            const result = await speechRecognizer.recognizeSpeech()
            speechSynthesis.speak(`Azt mondtad: ${result}`)
            console.log('Recognized speech:', result)
          }}
        >
          🎤 Speak
        </Button>
      </div>
    )
  },
})
