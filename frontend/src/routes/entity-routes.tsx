import type { Injector } from '@furystack/inject'
import { createComponent } from '@furystack/shades'
import type { IconDefinition } from '@furystack/shades-common-components'
import { icons } from '@furystack/shades-common-components'

import { hasCacheValue } from '@furystack/cache'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'
import { DashboardService } from '../services/dashboards-service.js'
import { MovieFilesService } from '../services/movie-files-service.js'
import { MoviesService } from '../services/movies-service.js'

type EntityEditorChildrenOptions = {
  icon: IconDefinition
  editTitle: (id: string, injector: Injector) => string
}

const getEntityEditorChildren = ({ icon, editTitle }: EntityEditorChildrenOptions) => ({
  '/create': { meta: { title: 'Create', icon: icons.plus, hidden: true }, component: () => <></> },
  '/edit/:id': {
    meta: {
      title: ({ match, injector }: { match: { params: object }; injector: Injector }) =>
        editTitle((match.params as { id: string }).id, injector),
      icon,
      hidden: true,
    },
    component: () => <></>,
  },
  '/': { component: () => <></>, routingOptions: { end: false } },
})

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
    '/drives': {
      meta: { title: 'Drives', icon: icons.folderOpen },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { DrivesPage } = await import('../pages/entities/drives.js')
            return <DrivesPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.folderOpen,
        editTitle: (id) => id,
      }),
    },
    '/users': {
      meta: { title: 'Users', icon: icons.users },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { UsersPage } = await import('../pages/entities/users.js')
            return <UsersPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.users,
        editTitle: (id) => id,
      }),
    },
    '/dashboards': {
      meta: { title: 'Dashboards', icon: icons.layers },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { DashboardsPage } = await import('../pages/entities/dashboards.js')
            return <DashboardsPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.layers,
        editTitle: (id, injector) => {
          const state = injector.getInstance(DashboardService).getDashboardAsObservable(id).getValue()
          return hasCacheValue(state) ? state.value.name : id
        },
      }),
    },
    '/movies': {
      meta: { title: 'Movies', icon: icons.film },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { MoviesPage } = await import('../pages/entities/movies.js')
            return <MoviesPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.film,
        editTitle: (id, injector) => {
          const state = injector.getInstance(MoviesService).getMovieAsObservable(id).getValue()
          return hasCacheValue(state) ? state.value?.title : id
        },
      }),
    },
    '/movie-files': {
      meta: { title: 'Movie Files', icon: icons.file },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { MovieFilesPage } = await import('../pages/entities/movie-files.js')
            return <MovieFilesPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.file,
        editTitle: (id, injector) => {
          const state = injector.getInstance(MovieFilesService).getMovieFileAsObservable(id).getValue()
          return hasCacheValue(state) ? state.value?.path : id
        },
      }),
    },
    '/omdb-movie-metadata': {
      meta: { title: 'OMDB Movie Metadata', icon: icons.globe },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { OmdbMovieMetadataPage } = await import('../pages/entities/omdb-movie-metadata.js')
            return <OmdbMovieMetadataPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.globe,
        editTitle: (id) => id,
      }),
    },
    '/omdb-series-metadata': {
      meta: { title: 'OMDB Series Metadata', icon: icons.globe },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { OmdbSeriesMetadataPage } = await import('../pages/entities/omdb-series-metadata.js')
            return <OmdbSeriesMetadataPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.globe,
        editTitle: (id) => id,
      }),
    },
    '/config': {
      meta: { title: 'Config', icon: icons.settings },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { ConfigPage } = await import('../pages/entities/config.js')
            return <ConfigPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.settings,
        editTitle: (id) => id,
      }),
    },
    '/iot-devices': {
      meta: { title: 'IoT Devices', icon: icons.plug },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { IotDevicesPage } = await import('../pages/entities/iot-devices.js')
            return <IotDevicesPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.plug,
        editTitle: (id) => id,
      }),
    },
    '/logging': {
      meta: { title: 'Logging', icon: icons.fileText },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { LoggingPage } = await import('../pages/entities/logging.js')
            return <LoggingPage />
          }}
        />
      ),
      children: getEntityEditorChildren({
        icon: icons.fileText,
        editTitle: (id) => id,
      }),
    },
    '/': {
      component: () => <></>,
      routingOptions: { end: false },
    },
  },
}
