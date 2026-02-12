import type { Injector } from '@furystack/inject'
import {
  NestedRouteLink,
  createComponent,
  type ChildrenList,
  type NestedRoute,
  type TypedNestedRouteLinkProps,
} from '@furystack/shades'
import { AppBarLink, type AppBarLinkProps } from '@furystack/shades-common-components'
import { decode } from 'common'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from './components/pirat-lazy-load.js'
import { navigateToRoute } from './navigate-to-route.js'

/**
 * Like ExtractRoutePaths from @furystack/shades but with NestedRoute<never> constraint
 * to support routes with specific match parameter types.
 */
type ConcatPaths<Parent extends string, Child extends string> = Parent extends '/' ? Child : `${Parent}${Child}`

type ExtractRoutePaths<T extends Record<string, NestedRoute<never>>> = {
  [K in keyof T & string]:
    | K
    | (T[K] extends { children: infer C extends Record<string, NestedRoute<never>> }
        ? ConcatPaths<K, ExtractRoutePaths<C> & string>
        : never)
}[keyof T & string]

const settingsChildren = {
  '/': {
    component: () => <></>,
    onVisit: async ({ injector }: { injector: Injector }) => {
      navigateToRoute(injector, '/app-settings/omdb', {}, { replace: true })
    },
  },
  '/omdb': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSettingsPage } = await import('./pages/admin/omdb-settings.js')
          return <OmdbSettingsPage />
        }}
      />
    ),
  },
  '/streaming': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { StreamingSettingsPage } = await import('./pages/admin/streaming-settings.js')
          return <StreamingSettingsPage />
        }}
      />
    ),
  },
  '/iot': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotSettingsPage } = await import('./pages/admin/iot-settings.js')
          return <IotSettingsPage />
        }}
      />
    ),
  },
  '/ai': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiSettingsPage } = await import('./pages/admin/ai-settings.js')
          return <AiSettingsPage />
        }}
      />
    ),
  },
  '/users/:username': {
    component: ({ match }: { match: MatchResult<{ username: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { UserDetailsPage } = await import('./pages/admin/user-details.js')
          return <UserDetailsPage username={match.params.username} />
        }}
      />
    ),
  },
  '/users': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserListPage } = await import('./pages/admin/user-list.js')
          return <UserListPage />
        }}
      />
    ),
  },
}

export const appRoutes = {
  '/movies': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieList } = await import('./pages/movies/movie-list.js')
          return <MovieList />
        }}
      />
    ),
  },
  '/movies/:id/watch': {
    component: ({ match }: { match: MatchResult<{ id: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieLoader } = await import('./pages/movies/movie-loader.js')
          return <MovieLoader movieFileId={match.params.id} />
        }}
      />
    ),
  },
  '/movies/:imdbId/overview': {
    component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieOverview } = await import('./pages/movies/movie-overview.js')
          return <MovieOverview imdbId={match.params.imdbId} />
        }}
      />
    ),
  },
  '/series': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { SeriesList } = await import('./pages/movies/series-list.js')
          return <SeriesList />
        }}
      />
    ),
  },
  '/series/:imdbId': {
    component: ({ match }: { match: MatchResult<{ imdbId: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { SeriesOverview } = await import('./pages/movies/series-overview.js')
          return <SeriesOverview imdbId={match.params.imdbId} />
        }}
      />
    ),
  },
  '/app-settings': {
    component: ({ outlet }: { outlet?: JSX.Element }) => (
      <PiRatLazyLoad
        component={async () => {
          const { AppSettingsPage } = await import('./pages/admin/app-settings.js')
          return <AppSettingsPage outlet={outlet} />
        }}
      />
    ),
    children: settingsChildren,
  },
  '/entities/drives': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DrivesPage } = await import('./pages/entities/drives.js')
          return <DrivesPage />
        }}
      />
    ),
  },
  '/entities/users': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UsersPage } = await import('./pages/entities/users.js')
          return <UsersPage />
        }}
      />
    ),
  },
  '/entities/dashboards': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DashboardsPage } = await import('./pages/entities/dashboards.js')
          return <DashboardsPage />
        }}
      />
    ),
  },
  '/entities/movies': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MoviesPage } = await import('./pages/entities/movies.js')
          return <MoviesPage />
        }}
      />
    ),
  },
  '/entities/movie-files': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieFilesPage } = await import('./pages/entities/movie-files.js')
          return <MovieFilesPage />
        }}
      />
    ),
  },
  '/entities/omdb-movie-metadata': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbMovieMetadataPage } = await import('./pages/entities/omdb-movie-metadata.js')
          return <OmdbMovieMetadataPage />
        }}
      />
    ),
  },
  '/entities/omdb-series-metadata': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSeriesMetadataPage } = await import('./pages/entities/omdb-series-metadata.js')
          return <OmdbSeriesMetadataPage />
        }}
      />
    ),
  },
  '/entities/config': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { ConfigPage } = await import('./pages/entities/config.js')
          return <ConfigPage />
        }}
      />
    ),
  },
  '/entities/iot-devices': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotDevicesPage } = await import('./pages/entities/iot-devices.js')
          return <IotDevicesPage />
        }}
      />
    ),
  },
  '/entities/logging': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { LoggingPage } = await import('./pages/entities/logging.js')
          return <LoggingPage />
        }}
      />
    ),
  },
  '/file-browser': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DrivesPage } = await import('./pages/file-browser/index.js')
          return <DrivesPage />
        }}
      />
    ),
  },
  '/file-browser/openFile/:driveLetter/:path': {
    component: ({ match }: { match: MatchResult<{ driveLetter: string; path: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { FilesPage } = await import('./pages/files/index.js')
          return <FilesPage letter={decode(match.params.driveLetter)} path={decode(match.params.path)} />
        }}
      />
    ),
  },
  '/iot/devices': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DeviceList } = await import('./pages/iot/device-list.js')
          return <DeviceList />
        }}
      />
    ),
  },
  '/iot/device/:id': {
    component: ({ match }: { match: MatchResult<{ id: string }> }) => (
      <div style={{ paddingTop: '5em' }}>Device {match.params.id}</div>
    ),
  },
  '/logging/terminal': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { LogEntriesTerminal } = await import('./pages/logging/log-entries-terminal.js')
          return <LogEntriesTerminal />
        }}
      />
    ),
  },
  '/logging/log-entry/:id': {
    component: ({ match }: { match: MatchResult<{ id: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { LogEntry } = await import('./pages/logging/log-entry.js')
          return <LogEntry id={match.params.id} />
        }}
      />
    ),
  },
  '/chat': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { ChatPage } = await import('./pages/chat/index.js')
          return <ChatPage />
        }}
      />
    ),
  },
  '/ai': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AiPage } = await import('./pages/ai/ai-page.js')
          return <AiPage />
        }}
      />
    ),
  },
  '/user/settings': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UserSettingsPage } = await import('./pages/user/settings.js')
          return <UserSettingsPage />
        }}
      />
    ),
  },
  '/dashboards/:id': {
    component: ({ match }: { match: MatchResult<{ id: string }> }) => (
      <PiRatLazyLoad
        component={async () => {
          const { LoadableDashboard } = await import('./components/dashboard/LoadableDashboard.js')
          return <LoadableDashboard id={match.params.id} />
        }}
      />
    ),
  },
  '/': {
    routingOptions: { end: false },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DefaultDashboard } = await import('./components/dashboard/default-dashboard.js')
          return <DefaultDashboard />
        }}
      />
    ),
  },
}

export const authRoutes = {
  '/register': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { Register } = await import('./pages/register.js')
          return <Register />
        }}
      />
    ),
  },
  '': {
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { Login } = await import('./pages/login.js')
          return <Login />
        }}
      />
    ),
  },
}

export type AppPaths = ExtractRoutePaths<typeof appRoutes & typeof authRoutes>

export const AppLink = NestedRouteLink as unknown as <TPath extends AppPaths>(
  props: TypedNestedRouteLinkProps<TPath>,
  children?: ChildrenList,
) => JSX.Element

export const AppBarAppLink = AppBarLink as unknown as <TPath extends AppPaths>(
  props: AppBarLinkProps & { href: TPath },
  children?: ChildrenList,
) => JSX.Element
