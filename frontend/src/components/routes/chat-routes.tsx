import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const chatPageRoute = {
  url: '/chat',
  onVisit,
  onLeave,
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { ChatPage } = await import('../../pages/chat/index.js')
          return <ChatPage />
        }}
      />
    )
  },
}

export const chatRoutes = [chatPageRoute] as const
