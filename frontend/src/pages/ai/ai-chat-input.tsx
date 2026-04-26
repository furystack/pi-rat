import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input } from '@furystack/shades-common-components'
import { getUser } from '../../utils/session-helpers.js'
import { AiChatMessageService } from './ai-chat-message-service.js'
import { AiChatService } from './ai-chat-service.js'

export type AiMessagePayload = {
  message: string
}

export const isAiMessagePayload = (data: unknown): data is AiMessagePayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.message === 'string' && d.message.trim() !== ''
}

export const AiChatInput = Shade<{ selectedChatId: string }>({
  customElementName: 'pi-rat-ai-chat-input',
  style: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  render: ({ props, injector, useObservable, useRef }) => {
    const aiChatMessageService = injector.get(AiChatMessageService)
    const aiChatService = injector.get(AiChatService)
    const formRef = useRef<HTMLFormElement>('form')

    const [selectedChat] = useObservable(
      'selectedChat',
      aiChatService.getAiChatsAsObservable({
        filter: {
          id: { $eq: props.selectedChatId },
        },
      }),
    )

    return (
      <Form<AiMessagePayload>
        ref={formRef}
        onSubmit={({ message }) => {
          void aiChatMessageService
            .createChatMessage({
              aiChatId: props.selectedChatId,
              content: message,
              role: 'user',
              createdAt: new Date(),
              id: crypto.randomUUID(),
              owner: getUser(injector).username,
              visibility: selectedChat?.value?.entries[0]?.visibility ?? 'private',
            })
            .then(() => {
              formRef.current?.reset()
            })
        }}
        validate={isAiMessagePayload}
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
