import { createComponent, Shade } from '@furystack/shades'
import { AppBarLink } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'

export const ChatIcon = Shade({
  shadowDomName: 'shade-app-chat-icon',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)

    if (sessionState !== 'authenticated') {
      return null
    }

    return (
      <AppBarLink title="Chat" href="/chat">
        {sessionState === 'authenticated' ? '💬' : '🔒 Login to chat'}
      </AppBarLink>
    )
  },
})
