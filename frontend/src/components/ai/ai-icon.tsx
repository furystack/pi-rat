import { createComponent, Shade } from '@furystack/shades'
import { AppBarLink } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'
import { aiPageRoute } from '../routes/ai-routes.js'

export const AiIcon = Shade({
  shadowDomName: 'shade-app-ai-icon',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)

    if (sessionState !== 'authenticated') {
      return null
    }

    return (
      <AppBarLink title="Ai" href={aiPageRoute.url}>
        {sessionState === 'authenticated' ? '🤖' : '🔒 Login to Ai'}
      </AppBarLink>
    )
  },
})
