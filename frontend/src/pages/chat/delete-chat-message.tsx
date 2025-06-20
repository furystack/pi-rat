import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService } from '@furystack/shades-common-components'
import type { ChatMessage } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatMessageService } from './chat-messages-service.js'

export const DeleteChatMessage = Shade<{ chatMessage: ChatMessage }>({
  shadowDomName: 'shade-app-delete-chat-message',
  render: ({ injector, props }) => {
    const currentUser = injector.getInstance(SessionService).currentUser.getValue()
    const { chatMessage } = props
    const noty = injector.getInstance(NotyService)

    if (chatMessage.owner !== currentUser?.username) {
      return null
    }

    return (
      <Button
        style={{
          fontSize: '8px',
          width: '16px',
          height: '16px',
          padding: '2px',
        }}
        onclick={async () => {
          if (!confirm('Are you sure you want to delete this message?')) {
            return
          }
          try {
            await injector.getInstance(ChatMessageService).deleteChatMessage(chatMessage.id)
            noty.emit('onNotyAdded', {
              type: 'success',
              title: '✅ Success',
              body: 'Message deleted successfully.',
            })
          } catch (error) {
            noty.emit('onNotyAdded', {
              type: 'error',
              title: '❗ Error',
              body: `Failed to delete message: ${(error as Error).message}`,
            })
          }
        }}
      >
        ❌
      </Button>
    )
  },
})
