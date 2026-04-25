import { createComponent, Shade } from '@furystack/shades'
import { AppBarAppLink } from '../../routes/index.js'
import { SessionService } from '../../services/session.js'

export const AiIcon = Shade({
  customElementName: 'shade-app-ai-icon',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)

    if (sessionState !== 'authenticated') {
      return null
    }

    return (
      <AppBarAppLink title="Ai" path="/ai">
        {sessionState === 'authenticated' ? '🤖' : '🔒 Login to Ai'}
      </AppBarAppLink>
    )
  },
})
