import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, ThemeProviderService } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatMessageService } from './chat-messages-service.js'

export const MessageInput = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-message-input',
  render: ({ injector, props, useRef }) => {
    const chatService = injector.getInstance(ChatMessageService)
    const session = injector.getInstance(SessionService)
    const theme = injector.getInstance(ThemeProviderService)
    const formRef = useRef<HTMLElement>('form')

    return (
      <Form<{ content: string }>
        ref={formRef}
        onSubmit={(formData) => {
          void chatService.addChatMessage({
            id: crypto.randomUUID(),
            createdAt: new Date(),
            chatId: props.chat.id,
            content: formData.content,
            owner: session.currentUser.getValue()?.username || '',
            attachments: [],
          })
          const form = formRef.current?.querySelector('form') ?? formRef.current
          if (form && 'reset' in form) {
            ;(form as HTMLFormElement).reset()
          }
        }}
        validate={(formData: unknown): formData is { content: string } => {
          return (
            typeof formData === 'object' &&
            formData !== null &&
            'content' in formData &&
            typeof (formData as { content: unknown }).content === 'string' &&
            (formData as { content: string }).content.trim().length > 0
          )
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <textarea
          style={{
            flexGrow: '1',
            backgroundColor: theme.theme.background.paper,
            color: theme.theme.text.primary,
            outline: 'none',
          }}
          name="content"
        />
        <Button type="submit">Send</Button>
      </Form>
    )
  },
})
