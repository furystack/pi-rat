import { createComponent, LocationService, NestedRouter, Shade } from '@furystack/shades'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { SettingsMenuItem, SettingsMenuSection, SettingsSidebar } from '../../components/settings-sidebar/index.js'

const settingsRoutes = {
  '/app-settings/omdb': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('./omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
  '/app-settings/streaming': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { StreamingSettingsPage } = await import('./streaming-settings.js')
          return <StreamingSettingsPage />
        }}
      />
    ),
  },
  '/app-settings/iot': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotSettingsPage } = await import('./iot-settings.js')
          return <IotSettingsPage />
        }}
      />
    ),
  },
  '/app-settings/ai': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiSettingsPage } = await import('./ai-settings.js')
          return <AiSettingsPage />
        }}
      />
    ),
  },
  '/app-settings/users/:username': {
    component: ({ match }: { match: MatchResult<{ username: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { UserDetailsPage } = await import('./user-details.js')
          return <UserDetailsPage username={match.params.username} />
        }}
      />
    ),
  },
  '/app-settings/users': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserListPage } = await import('./user-list.js')
          return <UserListPage />
        }}
      />
    ),
  },
  '/app-settings': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('./omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
}

export const AppSettingsPage = Shade({
  shadowDomName: 'app-settings-page',
  css: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    '& .settings-layout': {
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      marginTop: '48px',
    },
    '& .settings-content': {
      flex: '1',
      overflow: 'auto',
      padding: '24px 48px',
    },
  },
  render: ({ injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)

    // Redirect to OMDB settings if on base /app-settings path
    if (currentPath === '/app-settings') {
      requestAnimationFrame(() => {
        window.history.replaceState({}, '', '/app-settings/omdb')
        locationService.updateState()
      })
    }

    return (
      <div className="settings-layout">
        <SettingsSidebar>
          <SettingsMenuSection title="Media">
            <SettingsMenuItem icon="🎬" label="OMDB Settings" href="/app-settings/omdb" />
            <SettingsMenuItem icon="📺" label="Streaming Settings" href="/app-settings/streaming" />
          </SettingsMenuSection>
          <SettingsMenuSection title="IOT">
            <SettingsMenuItem icon="📡" label="Device Availability" href="/app-settings/iot" />
          </SettingsMenuSection>
          <SettingsMenuSection title="AI">
            <SettingsMenuItem icon="🤖" label="Ollama Settings" href="/app-settings/ai" />
          </SettingsMenuSection>
          <SettingsMenuSection title="Identity">
            <SettingsMenuItem icon="👥" label="Users" href="/app-settings/users" />
          </SettingsMenuSection>
        </SettingsSidebar>

        <div className="settings-content">
          <NestedRouter routes={settingsRoutes} />
        </div>
      </div>
    )
  },
})
