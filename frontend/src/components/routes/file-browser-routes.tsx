import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { decode } from 'common'
import type { MatchResult } from 'path-to-regexp'

export const fileBrowserRoute = {
  url: '/file-browser',
  onVisit,
  onLeave,
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
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ driveLetter: string; path: string }> }) => (
    <PiRatLazyLoad
      component={async () => {
        const { FilesPage } = await import('../../pages/files/index.js')
        return <FilesPage letter={decode(match.params.driveLetter)} path={decode(match.params.path)} />
      }}
    />
  ),
}

export const fileBrowserRoutes = [fileBrowserRoute, fileBrowserOpenFileRoute] as const
