import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

export const aiPageRoute = {
  url: '/ai',
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { AiPage } = await import('../../pages/ai/ai-page.js')
          return <AiPage />
        }}
      />
    )
  },
}

export const aiRoutes = {
  [aiPageRoute.url]: aiPageRoute,
}
