import { createComponent, Shade } from '@furystack/shades'

export const AiChatInput = Shade({
  shadowDomName: 'pi-rat-ai-chat-input',
  style: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  render: () => {
    return (
      <div>
        <input type="text" placeholder="Type your message..." />
        <button type="submit">Send</button>
      </div>
    )
  },
})
