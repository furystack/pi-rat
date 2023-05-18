import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

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
} as const

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
} as const

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
} as const

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
} as const

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
} as const

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
} as const

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
} as const

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
} as const

export const entityRoutes = [
  entityDrivesRoute,
  entityUsersRoute,
  entityDashboardsRoute,
  entityMoviesRoute,
  entityMovieFilesRoute,
  entityOmdbMovieMetadataRoute,
  entityOmdbSeriesMetadataRoute,
  entityConfigRoute,
] as const

export type EntityUrl = (typeof entityRoutes)[number]['url']
