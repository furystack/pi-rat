import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'
import { AiChatMessageService } from './ai-chat-message-service.js'
import { AiChatService } from './ai-chat-service.js'

export const AiChatInput = Shade<{ selectedChatId: string }>({
  shadowDomName: 'pi-rat-ai-chat-input',
  style: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  render: ({ props, injector, useObservable, element }) => {
    const aiChatMessageService = injector.getInstance(AiChatMessageService)
    const aiChatService = injector.getInstance(AiChatService)
    const sessionService = injector.getInstance(SessionService)

    const [selectedChat] = useObservable(
      'selectedChat',
      aiChatService.getAiChatsAsObservable({
        filter: {
          id: { $eq: props.selectedChatId },
        },
      }),
    )

    return (
      <Form<{ message: string }>
        onSubmit={({ message }) => {
          void aiChatMessageService
            .createChatMessage({
              aiChatId: props.selectedChatId,
              content: message,
              role: 'user',
              createdAt: new Date(),
              id: crypto.randomUUID(),
              owner: sessionService.currentUser.getValue()!.username,
              visibility: selectedChat?.value?.entries[0]?.visibility ?? 'private',
            })
            .then(() => element.querySelector<HTMLFormElement>('form')?.reset())
        }}
        validate={(formData): formData is { message: string } => {
          return (
            'message' in formData &&
            typeof (formData as { message?: unknown }).message === 'string' &&
            (formData as { message: string }).message.trim() !== ''
          )
        }}
        style={{ display: 'flex', flexDirection: 'row', width: '100%' }}
      >
        <Input
          type="text"
          name="message"
          placeholder="Type your message..."
          style={{
            flexGrow: '1',
            marginRight: '8px',
          }}
        />
        <Button type="submit">Send</Button>
      </Form>
    )
  },
})
