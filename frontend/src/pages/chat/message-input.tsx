import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, TextArea } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { getUser } from '../../utils/session-helpers.js'
import { ChatMessageService } from './chat-messages-service.js'

export type ChatMessagePayload = {
  content: string
}

export const isChatMessagePayload = (data: unknown): data is ChatMessagePayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.content === 'string' && d.content.trim().length > 0
}

export const MessageInput = Shade<{ chat: Chat }>({
  customElementName: 'shade-app-message-input',
  render: ({ injector, props, useRef }) => {
    const chatService = injector.get(ChatMessageService)
    const formRef = useRef<HTMLFormElement>('form')

    return (
      <Form<ChatMessagePayload>
        ref={formRef}
        onSubmit={(formData) => {
          void chatService.addChatMessage({
            id: crypto.randomUUID(),
            createdAt: new Date(),
            chatId: props.chat.id,
            content: formData.content,
            owner: getUser(injector).username,
            attachments: [],
          })
          formRef.current?.reset()
        }}
        validate={isChatMessagePayload}
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <TextArea name="content" variant="contained" style={{ flexGrow: '1' }} />
        <Button type="submit">Send</Button>
      </Form>
    )
  },
})
