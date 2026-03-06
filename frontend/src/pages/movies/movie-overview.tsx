import type { CacheWithValue } from '@furystack/cache'
import { isLoadedCacheResult } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, Skeleton, Typography } from '@furystack/shades-common-components'
import type { Movie } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { SessionService } from '../../services/session.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MediaOverviewLayout } from './media-overview-layout.js'

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
  render: ({ props, useObservable, injector }) => {
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const movie = props.data.value

    return (
      <MediaOverviewLayout thumbnailUrl={movie.thumbnailImageUrl || ''} title={movie.title}>
        <Typography variant="h1">{movie.title}</Typography>
        <Typography variant="caption">
          {movie.year?.toString()} &nbsp; {movie.genre}
        </Typography>
        <Typography variant="body1" align="justify">
          {movie.plot}
        </Typography>
        <div>
          <PlayButtons imdbId={movie.imdbId} />
          {currentUser?.roles.includes('movie-admin') ? (
            <span>
              <Button
                onclick={() => {
                  navigateToRoute(injector, '/entities/movies/edit/:id', { id: movie.imdbId })
                }}
              >
                Edit
              </Button>
            </span>
          ) : null}
        </div>
      </MediaOverviewLayout>
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
        error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
      />
    )
  },
})
