import { createComponent, Shade } from '@furystack/shades'
import { AppBarAppLink } from '../../routes/index.js'
import { SessionService } from '../../services/session.js'

export const ChatIcon = Shade({
  customElementName: 'shade-app-chat-icon',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)

    if (sessionState !== 'authenticated') {
      return null
    }

    return (
      <AppBarAppLink title="Chat" path="/chat">
        {sessionState === 'authenticated' ? '💬' : '🔒 Login to chat'}
      </AppBarAppLink>
    )
  },
})
