import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

export const chatPageRoute = {
  url: '/chat',
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

export const chatRoutes = {
  [chatPageRoute.url]: chatPageRoute,
}
