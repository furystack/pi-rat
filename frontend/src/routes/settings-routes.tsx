import type { Injector } from '@furystack/inject'
import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'
import { navigateToRoute } from '../utils/navigate-to-route.js'

export const settingsChildren = {
  '/': {
    component: () => <></>,
    onVisit: async ({ injector }: { injector: Injector }) => {
      navigateToRoute(injector, '/app-settings/omdb', {}, { replace: true })
    },
  },
  '/omdb': {
    meta: { title: 'OMDB Settings', icon: icons.film },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('../pages/admin/omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
  '/streaming': {
    meta: { title: 'Streaming Settings', icon: icons.play },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { StreamingSettingsPage } = await import('../pages/admin/streaming-settings.js')
          return <StreamingSettingsPage />
        }}
      />
    ),
  },
  '/iot': {
    meta: { title: 'IoT Settings', icon: icons.plug },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotSettingsPage } = await import('../pages/admin/iot-settings.js')
          return <IotSettingsPage />
        }}
      />
    ),
  },
  '/ai': {
    meta: { title: 'AI Settings', icon: icons.wand },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiSettingsPage } = await import('../pages/admin/ai-settings.js')
          return <AiSettingsPage />
        }}
      />
    ),
  },
  '/users/:username': {
    meta: {
      title: ({ match }: TitleResolverOptions<{ username: string }>): string => match.params.username,
      icon: icons.user,
      hidden: true,
    },
    component: ({ match }: { match: MatchResult<{ username: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { UserDetailsPage } = await import('../pages/admin/user-details.js')
          return <UserDetailsPage username={match.params.username} />
        }}
      />
    ),
  },
  '/users': {
    meta: { title: 'Users', icon: icons.users },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserListPage } = await import('../pages/admin/user-list.js')
          return <UserListPage />
        }}
      />
    ),
  },
}

export const settingsRoute = {
  meta: { title: 'Settings', icon: icons.settings },
  component: ({ outlet }: { outlet?: JSX.Element }) => (
    <PiRatLazyLoad
      component={async () => {
        const { AppSettingsPage } = await import('../pages/admin/app-settings.js')
        return <AppSettingsPage outlet={outlet} />
      }}
    />
  ),
  children: settingsChildren,
}
