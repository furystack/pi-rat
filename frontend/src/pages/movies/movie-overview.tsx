import type { CacheWithValue } from '@furystack/cache'
import { isLoadedCacheResult } from '@furystack/cache'
import { serializeToQueryString } from '@furystack/rest'
import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Button, CacheView, promisifyAnimation, Skeleton } from '@furystack/shades-common-components'
import type { Movie } from 'common'
import { navigateToRoute } from '../../navigate-to-route.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { SessionService } from '../../services/session.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'

export const PlayButtons = Shade<{ imdbId: string }>({
  shadowDomName: 'shade-movie-play-buttons',
  render: ({ props, useObservable, injector }) => {
    const watchProgressService = injector.getInstance(WatchProgressService)
    const movieFileService = injector.getInstance(MovieFilesService)
    const [movieFilesResult] = useObservable(
      'movieFiles',
      movieFileService.findMovieFileAsObservable({ filter: { imdbId: { $eq: props.imdbId } } }),
    )
    const [watchProgressResult] = useObservable(
      'watchProgress',
      watchProgressService.findWatchProgressAsObservable({
        filter: {
          $or:
            movieFilesResult?.value?.entries.map((v) => ({
              path: { $eq: v.path },
              driveLetter: { $eq: v.driveLetter },
            })) || [],
        },
      }),
    )

    if (isLoadedCacheResult(movieFilesResult) && isLoadedCacheResult(watchProgressResult)) {
      return (
        <>
          {movieFilesResult.value.entries.map((movieFile) => {
            const watchProgress = watchProgressResult.value.entries.find(
              (wp) => wp.driveLetter === movieFile.driveLetter && wp.path === movieFile.path,
            )
            if (watchProgress) {
              return (
                <div>
                  <Button
                    variant="contained"
                    color="primary"
                    onclick={() => {
                      navigateToRoute(injector, '/movies/:id/watch', { id: movieFile.id })
                    }}
                  >
                    Continue from{' '}
                    {(() => {
                      const date = new Date(0)
                      date.setSeconds(watchProgressResult.value.entries[0].watchedSeconds)
                      return date.toISOString().substr(11, 8)
                    })()}
                  </Button>
                  <Button
                    onclick={async () => {
                      await watchProgressService.deleteWatchEntry(watchProgressResult.value.entries[0].id)
                      navigateToRoute(injector, '/movies/:id/watch', { id: movieFile.id })
                    }}
                  >
                    Watch from the beginning
                  </Button>
                  {movieFilesResult.value.count > 1 ? <>{`${movieFile.driveLetter}:${movieFile.path}`}</> : null}
                </div>
              )
            }
            return (
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  onclick={() => {
                    navigateToRoute(injector, '/movies/:id/watch', { id: movieFile.id })
                  }}
                >
                  Start watching
                </Button>
                {movieFilesResult.value.count > 1 ? <>{`${movieFile.driveLetter}:${movieFile.path}`}</> : null}
              </div>
            )
          })}
        </>
      )
    }

    return <Skeleton />
  },
})

const MovieOverviewContent = Shade<{ data: CacheWithValue<Movie> }>({
  shadowDomName: 'shade-movie-overview-content',
  render: ({ props, useObservable, injector, useRef }) => {
    const imgRef = useRef<HTMLImageElement>('posterImg')
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)

    setTimeout(() => {
      void promisifyAnimation(
        imgRef.current,
        [
          { opacity: 0, transform: 'scale(0.85)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          easing: 'cubic-bezier(0.415, 0.225, 0.375, 1.355)',
          duration: 500,
          direction: 'alternate',
          fill: 'forwards',
        },
      )
    }, 100)
    const movie = props.data.value
    return (
      <div style={{ width: '100%', height: 'calc(100% - 40px', paddingTop: '40px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ padding: '2em' }}>
            <img
              ref={imgRef}
              src={movie.thumbnailImageUrl || ''}
              alt={`thumbnail for ${movie.title}`}
              style={{ boxShadow: '3px 3px 8px rgba(0,0,0,0.3)', borderRadius: '8px', opacity: '0' }}
            />
          </div>
          <div style={{ padding: '2em', maxWidth: '800px', minWidth: isDesktop ? '550px' : undefined }}>
            <h1>{movie.title}</h1>
            <p style={{ fontSize: '0.8em' }}>
              {movie.year?.toString()} &nbsp; {movie.genre}
            </p>
            <p style={{ textAlign: 'justify' }}>{movie.plot}</p>
            <div>
              <PlayButtons imdbId={movie.imdbId} />
              {currentUser?.roles.includes('movie-admin') ? (
                <span>
                  <Button
                    onclick={() => {
                      navigateToRoute(
                        injector,
                        '/entities/movies',
                        {},
                        {
                          queryString: serializeToQueryString({ gedst: { mode: 'edit', currentId: movie.imdbId } }),
                        },
                      )
                    }}
                  >
                    Edit
                  </Button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  },
})

export const MovieOverview = Shade<{ imdbId: string }>({
  shadowDomName: 'shade-movie-overview',
  render: ({ props, injector }) => {
    const movieService = injector.getInstance(MoviesService)

    return (
      <CacheView
        cache={movieService.movieCache}
        args={[props.imdbId]}
        content={MovieOverviewContent}
        loader={<Skeleton />}
        error={() => <>:(</>}
      />
    )
  },
})
