import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatService } from './chat-service.js'

export const DeleteChatButton = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-delete-chat-button',
  render: ({ injector, props, useSearchState }) => {
    const chatService = injector.getInstance(ChatService)

    const user = injector.getInstance(SessionService).currentUser.getValue()
    const noty = injector.getInstance(NotyService)

    const [selectedChatId, setSelectedChatId] = useSearchState('selectedChatId', '')

    const handleDelete = async () => {
      if (props.chat.id === selectedChatId) {
        setSelectedChatId('')
      }
      await chatService.deleteChat(props.chat.id)
    }

    return (
      <Button
        disabled={props.chat.owner !== user?.username}
        onclick={async () => {
          if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
            return
          }
          try {
            await handleDelete()
            noty.emit('onNotyAdded', {
              type: 'success',
              title: '✅ Success',
              body: 'Chat deleted successfully.',
            })
          } catch (error) {
            noty.emit('onNotyAdded', {
              type: 'error',
              title: '❗ Error',
              body: `Failed to delete chat: ${(error as Error).message}`,
            })
          }
        }}
      >
        Delete Chat
      </Button>
    )
  },
})
