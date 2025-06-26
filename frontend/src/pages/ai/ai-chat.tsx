import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { AiChatInput } from './ai-chat-input.js'
import { AiChatMessageList } from './ai-chat-message-list.js'

export const AiChat = Shade<{ model: string }>({
  shadowDomName: 'pi-rat-ai-chat',
  style: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  render: ({ props }) => {
    const { model } = props
    return (
      <Paper style={{ padding: '16px', flexGrow: '1' }}>
        <AiChatMessageList model={model} />
        <AiChatInput />
      </Paper>
    )
  },
})
