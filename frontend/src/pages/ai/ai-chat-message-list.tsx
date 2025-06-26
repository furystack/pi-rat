import { createComponent, Shade } from '@furystack/shades'
import { AiChatService } from './ai-chat-service.js'

export const AiChatMessageList = Shade<{
  model: string
}>({
  shadowDomName: 'pi-rat-ai-chat-message-list',
  style: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflowY: 'auto',
  },
  render: ({ useObservable, injector, props }) => {
    const { model } = props
    const aiChatService = injector.getInstance(AiChatService)
    const [messages] = useObservable(
      'messages',
      aiChatService.getChatAsObservable({
        model,
      }),
    )

    if (!messages?.value) {
      return <div>Loading messages...</div>
    }

    return <div>{messages.value.result.message.content}</div>
  },
})
