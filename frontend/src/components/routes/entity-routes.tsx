import { createComponent, type Route } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const entityDrivesRoute = {
  url: '/entities/drives',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { DrivesPage } = await import('../../pages/entities/drives.js')
        return <DrivesPage />
      }}
    />
  ),
} satisfies Route

export const entityUsersRoute = {
  url: '/entities/users',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { UsersPage } = await import('../../pages/entities/users.js')
        return <UsersPage />
      }}
    />
  ),
} satisfies Route

export const entityDashboardsRoute = {
  url: '/entities/dashboards',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { DashboardsPage } = await import('../../pages/entities/dashboards.js')
        return <DashboardsPage />
      }}
    />
  ),
} satisfies Route

export const entityMoviesRoute = {
  url: '/entities/movies',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { MoviesPage } = await import('../../pages/entities/movies.js')
        return <MoviesPage />
      }}
    />
  ),
} satisfies Route

export const entityMovieFilesRoute = {
  url: '/entities/movie-files',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { MovieFilesPage } = await import('../../pages/entities/movie-files.js')
        return <MovieFilesPage />
      }}
    />
  ),
} satisfies Route

export const entityOmdbMovieMetadataRoute = {
  url: '/entities/omdb-movie-metadata',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { OmdbMovieMetadataPage } = await import('../../pages/entities/omdb-movie-metadata.js')
        return <OmdbMovieMetadataPage />
      }}
    />
  ),
} satisfies Route

export const entityOmdbSeriesMetadataRoute = {
  url: '/entities/omdb-series-metadata',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { OmdbSeriesMetadataPage } = await import('../../pages/entities/omdb-series-metadata.js')
        return <OmdbSeriesMetadataPage />
      }}
    />
  ),
} satisfies Route

export const entityConfigRoute = {
  url: '/entities/config',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { ConfigPage } = await import('../../pages/entities/config.js')
        return <ConfigPage />
      }}
    />
  ),
} satisfies Route

export const entityDeviceRoute = {
  url: '/entities/iot-devices',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { IotDevicesPage } = await import('../../pages/entities/iot-devices.js')
        return <IotDevicesPage />
      }}
    />
  ),
} satisfies Route

export const entityLoggingRoute = {
  url: '/entities/logging',
  onVisit,
  onLeave,
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { LoggingPage } = await import('../../pages/entities/logging.js')
        return <LoggingPage />
      }}
    />
  ),
} satisfies Route

export const entityRoutes = [
  entityDrivesRoute,
  entityUsersRoute,
  entityDashboardsRoute,
  entityMoviesRoute,
  entityMovieFilesRoute,
  entityOmdbMovieMetadataRoute,
  entityOmdbSeriesMetadataRoute,
  entityConfigRoute,
  entityDeviceRoute,
  entityLoggingRoute,
]
