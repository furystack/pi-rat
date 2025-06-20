import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, ThemeProviderService } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatMessageService } from './chat-messages-service.js'

export const MessageInput = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-message-input',
  render: ({ injector, props, element }) => {
    const chatService = injector.getInstance(ChatMessageService)
    const session = injector.getInstance(SessionService)
    const theme = injector.getInstance(ThemeProviderService)

    return (
      <Form<{ content: string }>
        onSubmit={(formData) => {
          void chatService.addChatMessage({
            id: crypto.randomUUID(),
            createdAt: new Date(),
            chatId: props.chat.id,
            content: formData.content,
            owner: session.currentUser.getValue()?.username || '',
          })
          const form = element.firstElementChild as HTMLFormElement
          if (form) {
            form.reset()
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
