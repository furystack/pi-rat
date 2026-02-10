import { createComponent, Shade } from '@furystack/shades'
import { SettingsMenuItem, SettingsMenuSection, SettingsSidebar } from '../../components/settings-sidebar/index.js'

type AppSettingsPageProps = {
  outlet?: JSX.Element
}

export const AppSettingsPage = Shade<AppSettingsPageProps>({
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
  render: ({ props }) => {
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

        <div className="settings-content">{props.outlet}</div>
      </div>
    )
  },
})
