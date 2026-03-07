import type { CacheWithValue } from '@furystack/cache'
import { isLoadedCacheResult } from '@furystack/cache'
import { serializeToQueryString } from '@furystack/rest'
import { LazyLoad, Shade, createComponent } from '@furystack/shades'
import { CacheView, cssVariableTheme, Skeleton } from '@furystack/shades-common-components'
import type { Movie } from 'common'
import { AppLink } from '../../routes/index.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { SessionService } from '../../services/session.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { WidgetCard } from './widget-card.js'

const MovieWidgetContent = Shade<{
  data: CacheWithValue<Movie>
  index?: number
  size?: number
}>({
  customElementName: 'pi-rat-movie-widget-content',
  render: ({ props, injector, useObservable }) => {
    const { size = 256 } = props
    const movie = props.data.value
    const { imdbId } = movie

    const movieFileService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)

    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const [movieFile] = useObservable(
      'movieFile',
      movieFileService.findMovieFileAsObservable({ filter: { imdbId: { $eq: imdbId } } }),
    )

    return (
      <AppLink tabIndex={0} title={movie.plot || movie.title} href="/movies/:imdbId/overview" params={{ imdbId }}>
        <WidgetCard size={size} index={props.index}>
          <div
            className="overlay"
            style={{
              filter: 'drop-shadow(black 0px 0px 5px) drop-shadow(black 0px 0px 8px) drop-shadow(black 0px 0px 10px)',
            }}
          >
            {isLoadedCacheResult(movieFile) && movieFile.value.entries[0] ? (
              <div style={{ display: 'flex' }}>
                <div
                  title="Play movie"
                  style={{ width: '16px' }}
                  onclick={(ev) => {
                    ev.stopImmediatePropagation()
                    ev.preventDefault()
                    navigateToRoute(injector, '/movies/:id/watch', { id: movieFile.value.entries[0].id })
                  }}
                >
                  ▶️
                </div>
              </div>
            ) : null}

            {currentUser?.roles.includes('admin') ? (
              <div style={{ display: 'flex' }}>
                <div
                  style={{ width: '16px', height: '16px', marginLeft: '1em' }}
                  onclick={(ev) => {
                    ev.preventDefault()
                    ev.stopImmediatePropagation()
                    navigateToRoute(
                      injector,
                      '/entities/movies',
                      {},
                      {
                        queryString: serializeToQueryString({ gedst: { mode: 'edit', currentId: imdbId } }),
                      },
                    )
                  }}
                  title="Edit movie details"
                >
                  ✏️
                </div>
              </div>
            ) : null}
          </div>
          <img
            src={movie.thumbnailImageUrl as string}
            alt={movie.title}
            className="cover"
            style={{ backgroundColor: cssVariableTheme.background.default }}
          />
          <div className="title-bar">
            {movie.title}
            <LazyLoad
              loader={<div />}
              component={async () => {
                if (!isLoadedCacheResult(movieFile)) {
                  return <></>
                }

                const { entries: watchProgresses } = await watchProgressService.findWatchProgressForFile(
                  movieFile.value.entries[0],
                )

                const lastRecentWatchProgress = watchProgresses.find((w) =>
                  movieFile.value.entries.some((file) => file.driveLetter === w.driveLetter && file.path === w.path),
                )

                const percent =
                  lastRecentWatchProgress &&
                  Math.round(100 * (lastRecentWatchProgress.watchedSeconds / (movie.duration || Infinity)))

                return (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      height: '2px',
                      width: `${percent}%`,
                      background: cssVariableTheme.palette.primary.main,
                    }}
                  />
                )
              }}
            />
          </div>
        </WidgetCard>
      </AppLink>
    )
  },
})

export const MovieWidget = Shade<{
  imdbId: string
  index?: number
  size?: number
}>({
  customElementName: 'pi-rat-movie-widget',
  render: ({ props, injector }) => {
    const movieService = injector.getInstance(MoviesService)

    return (
      <CacheView
        cache={movieService.movieCache}
        args={[props.imdbId]}
        content={MovieWidgetContent}
        contentProps={{ index: props.index, size: props.size }}
        loader={<Skeleton />}
      />
    )
  },
})
