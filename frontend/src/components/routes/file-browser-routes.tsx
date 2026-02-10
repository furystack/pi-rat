import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { decode } from 'common'
import type { MatchResult } from 'path-to-regexp'

export const fileBrowserRoute = {
  url: '/file-browser',
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { DrivesPage } = await import('../../pages/file-browser/index.js')
        return <DrivesPage />
      }}
    />
  ),
}

export const fileBrowserOpenFileRoute = {
  url: '/file-browser/openFile/:driveLetter/:path',
  component: ({ match }: { match: MatchResult<{ driveLetter: string; path: string }> }) => (
    <PiRatLazyLoad
      component={async () => {
        const { FilesPage } = await import('../../pages/files/index.js')
        return <FilesPage letter={decode(match.params.driveLetter)} path={decode(match.params.path)} />
      }}
    />
  ),
}

export const fileBrowserRoutes = {
  [fileBrowserRoute.url]: fileBrowserRoute,
  [fileBrowserOpenFileRoute.url]: fileBrowserOpenFileRoute,
}
