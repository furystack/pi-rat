import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { getUser } from '../../utils/session-helpers.js'
import { ChatService } from './chat-service.js'

export const DeleteChatButton = Shade<{ chat: Chat }>({
  customElementName: 'shade-app-delete-chat-button',
  render: ({ injector, props, useSearchState }) => {
    const chatService = injector.getInstance(ChatService)

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
        color="error"
        disabled={props.chat.owner !== getUser(injector).username}
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
        ❌ Delete Chat
      </Button>
    )
  },
})
