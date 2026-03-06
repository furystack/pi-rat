import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const miscRoutes = {
  '/chat': {
    meta: { title: 'Chat', icon: icons.messageCircle },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { ChatPage } = await import('../pages/chat/index.js')
          return <ChatPage />
        }}
      />
    ),
  },
  '/ai': {
    meta: { title: 'AI', icon: icons.wand },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiPage } = await import('../pages/ai/ai-page.js')
          return <AiPage />
        }}
      />
    ),
  },
  '/dashboards/:id': {
    meta: {
      title: ({ match }: TitleResolverOptions<{ id: string }>): string => `Dashboard ${match.params.id}`,
      icon: icons.layers,
      hidden: true,
    },
    component: ({ match }: { match: MatchResult<{ id: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { LoadableDashboard } = await import('../components/dashboard/LoadableDashboard.js')
          return <LoadableDashboard id={match.params.id} />
        }}
      />
    ),
  },
  '/about': {
    meta: { title: 'About', icon: icons.info },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AboutPage } = await import('../pages/about.js')
          return <AboutPage />
        }}
      />
    ),
  },
  '/': {
    meta: { title: 'Home', icon: icons.home },
    routingOptions: { end: false },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DefaultDashboard } = await import('../components/dashboard/default-dashboard.js')
          return <DefaultDashboard />
        }}
      />
    ),
  },
}
