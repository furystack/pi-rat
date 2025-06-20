import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { SessionService } from '../../services/session.js'
import { ChatService } from './chat-service.js'

export const DeleteChatButton = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-delete-chat-button',
  render: ({ injector, props, useSearchState }) => {
    const chatService = injector.getInstance(ChatService)

    const user = injector.getInstance(SessionService).currentUser.getValue()

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
        onclick={() => {
          void handleDelete()
        }}
      >
        Delete Chat
      </Button>
    )
  },
})
