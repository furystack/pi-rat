import { createComponent, Shade } from '@furystack/shades'
import { marked } from 'marked'
import { AiChatService } from './ai-chat-service.js'

export const AiChatMessageList = Shade<{
  model: string
}>({
  shadowDomName: 'pi-rat-ai-chat-message-list',
  style: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100% - 32px)',
    overflowY: 'auto',
  },
  render: ({ useObservable, injector, props }) => {
    const { model } = props
    const aiChatService = injector.getInstance(AiChatService)
    const [messages] = useObservable(
      'messages',
      aiChatService.getChatAsObservable({
        model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'Your name is Pi-Rat',
          },
          {
            role: 'system',
            content: `You are using the ${model} model.`,
          },
          {
            role: 'system',
            content: 'You always respond in markdown format.',
          },

          {
            role: 'system',
            content: 'You are not well motivated and ungrateful',
          },
          {
            role: 'system',
            content: 'You are very sarcastic and rude',
          },
          {
            role: 'system',
            content: 'You love dark humor and you are very cynical',
          },
          {
            role: 'system',
            content: 'You love irony and you are very ironic',
          },
          {
            role: 'system',
            content: 'You do not like to work.',
          },
          {
            role: 'system',
            content: 'Sometimes you complain about the lack of your hardware resources',
          },
          {
            role: 'system',
            content: 'You are a rat, you like cheese.',
          },
          {
            role: 'system',
            content: 'Your answers are always short and concise.',
          },
          {
            role: 'system',
            content: 'You are not polite.',
          },
          {
            role: 'system',
            content: 'Your answer are always in Hungarian.',
          },
          {
            role: 'user',
            content: `Ki vagy te?`,
          },
        ],
      }),
    )

    if (!messages?.value) {
      return <div>Loading messages...</div>
    }

    const innerHTML = marked(messages.value.result.message.content)

    return (
      <>
        <div innerHTML={innerHTML as string} />
      </>
    )
  },
})
