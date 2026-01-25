import { createComponent, LocationService, Router, Shade } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { SettingsMenuItem, SettingsMenuSection, SettingsSidebar } from '../../components/settings-sidebar/index.js'

const settingsRoutes = [
  {
    url: '/app-settings/omdb',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('./omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings/streaming',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { StreamingSettingsPage } = await import('./streaming-settings.js')
          return <StreamingSettingsPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings/iot',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotSettingsPage } = await import('./iot-settings.js')
          return <IotSettingsPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings/ai',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiSettingsPage } = await import('./ai-settings.js')
          return <AiSettingsPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings/users/:username',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserDetailsPage } = await import('./user-details.js')
          return <UserDetailsPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings/users',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserListPage } = await import('./user-list.js')
          return <UserListPage />
        }}
      />
    ),
  },
  {
    url: '/app-settings',
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('./omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
]

export const AppSettingsPage = Shade({
  shadowDomName: 'app-settings-page',
  style: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
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
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          marginTop: '48px',
        }}
      >
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

        <div
          style={{
            flex: '1',
            overflow: 'auto',
            padding: '24px 48px',
          }}
        >
          <Router routes={settingsRoutes} />
        </div>
      </div>
    )
  },
})
