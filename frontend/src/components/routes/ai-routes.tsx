import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const aiPageRoute = {
  url: '/ai',
  onVisit,
  onLeave,
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

export const aiRoutes = [aiPageRoute] as const
