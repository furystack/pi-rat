import { createComponent, Shade } from '@furystack/shades'
import { Button, Input } from '@furystack/shades-common-components'
import type { Chat } from 'common'
import { ChatMessageService } from './chat-messages-service.js'

export const MessageInput = Shade<{ chat: Chat }>({
  shadowDomName: 'shade-app-message-input',
  render: ({ injector, props, useSearchState }) => {
    const service = injector.getInstance(ChatMessageService)

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Input type="text" placeholder="Type your message..." style={{ flexGrow: '1' }} />
        <Button onclick={async () => {}}>Send</Button>
      </div>
    )
  },
})
