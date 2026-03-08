import type { Injector } from '@furystack/inject'
import { createComponent } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'
import { EntityRouteRegistry } from '../services/registries/index.js'

export const ENTITY_PATHS = {
  drives: '/drives',
  users: '/users',
  dashboards: '/dashboards',
  movies: '/movies',
  movieFiles: '/movie-files',
  omdbMovieMetadata: '/omdb-movie-metadata',
  omdbSeriesMetadata: '/omdb-series-metadata',
  config: '/config',
  logging: '/logging',
} as const satisfies Record<string, `/${string}`>

export const entityEditorChildren = {
  '/create': { meta: { title: 'Create', icon: icons.plus, hidden: true }, component: () => <></> },
  '/edit/:id': { meta: { title: 'Edit', icon: icons.edit, hidden: true }, component: () => <></> },
  '/': { component: () => <></>, routingOptions: { end: false } },
}

const entityChildren = {
  [ENTITY_PATHS.drives]: {
    meta: { title: 'Drives', icon: icons.folderOpen },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DrivesPage } = await import('../pages/entities/drives.js')
          return <DrivesPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.users]: {
    meta: { title: 'Users', icon: icons.users },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UsersPage } = await import('../pages/entities/users.js')
          return <UsersPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.dashboards]: {
    meta: { title: 'Dashboards', icon: icons.layers },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DashboardsPage } = await import('../pages/entities/dashboards.js')
          return <DashboardsPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.movies]: {
    meta: { title: 'Movies', icon: icons.film },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MoviesPage } = await import('../pages/entities/movies.js')
          return <MoviesPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.movieFiles]: {
    meta: { title: 'Movie Files', icon: icons.file },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieFilesPage } = await import('../pages/entities/movie-files.js')
          return <MovieFilesPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.omdbMovieMetadata]: {
    meta: { title: 'OMDB Movie Metadata', icon: icons.globe },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbMovieMetadataPage } = await import('../pages/entities/omdb-movie-metadata.js')
          return <OmdbMovieMetadataPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.omdbSeriesMetadata]: {
    meta: { title: 'OMDB Series Metadata', icon: icons.globe },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { OmdbSeriesMetadataPage } = await import('../pages/entities/omdb-series-metadata.js')
          return <OmdbSeriesMetadataPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.config]: {
    meta: { title: 'Config', icon: icons.settings },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { ConfigPage } = await import('../pages/entities/config.js')
          return <ConfigPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
  [ENTITY_PATHS.logging]: {
    meta: { title: 'Logging', icon: icons.fileText },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { LoggingPage } = await import('../pages/entities/logging.js')
          return <LoggingPage />
        }}
      />
    ),
    children: entityEditorChildren,
  },
}

export const createEntityRoute = (injector: Injector) => {
  const pluginEntityRoutes = injector.getInstance(EntityRouteRegistry).getEntityRoutes()
  return {
    ...entityRoute,
    children: {
      ...entityChildren,
      ...pluginEntityRoutes,
      '/': {
        component: () => <></>,
        routingOptions: { end: false },
      },
    },
  }
}

export const entityRoute = {
  meta: { title: 'Entities', icon: icons.layers },
  component: ({ outlet }: { outlet?: JSX.Element }) => (
    <PiRatLazyLoad
      component={async () => {
        const { RouteIndexPage } = await import('../components/route-index-page.js')
        return <RouteIndexPage outlet={outlet} />
      }}
    />
  ),
  children: {
    ...entityChildren,
    '/': {
      component: () => <></>,
      routingOptions: { end: false },
    },
  },
}
