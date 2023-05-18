import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Button, promisifyAnimation } from '@furystack/shades-common-components'
import { SessionService } from '../../services/session.js'
import { MoviesService } from '../../services/movies-service.js'
import { isLoadedCacheResult } from '@furystack/cache'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { watchMovieRoute } from '../../components/routes/movie-routes.js'
import { entityMoviesRoute } from '../../components/routes/entity-routes.js'

export const MovieOverview = Shade<{ imdbId: string }>({
  shadowDomName: 'shade-movie-overview',
  render: ({ props, useObservable, injector, element }) => {
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)
    const movieService = injector.getInstance(MoviesService)
    const watchProgressService = injector.getInstance(WatchProgressService)

    const [movieResult] = useObservable('movie', movieService.getMovieAsObservable(props.imdbId))
    const [watchProgressResult] = useObservable(
      'watchProgress',
      watchProgressService.findWatchProgressAsObservable({ filter: { imdbId: { $eq: props.imdbId } }, top: 1 }),
    )

    if (isLoadedCacheResult(movieResult)) {
      setTimeout(() => {
        promisifyAnimation(
          element.querySelector('img'),
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
      const movie = movieResult.value
      return (
        <div style={{ width: '100%', height: 'calc(100% - 64px', paddingTop: '64px' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}>
            <div style={{ padding: '2em' }}>
              <img
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
                {isLoadedCacheResult(watchProgressResult) && watchProgressResult.value.entries[0] ? (
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      onclick={() => {
                        navigateToRoute(injector, watchMovieRoute, { id: props.imdbId })
                      }}>
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
                        navigateToRoute(injector, watchMovieRoute, { id: props.imdbId })
                      }}>
                      Watch from the beginning
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onclick={() => {
                      navigateToRoute(injector, watchMovieRoute, { id: props.imdbId })
                    }}>
                    Start watching{' '}
                  </Button>
                )}
                {currentUser?.roles.includes('movie-admin') ? (
                  <span>
                    <Button
                      onclick={() => {
                        navigateToRoute(injector, entityMoviesRoute, {}, `mode=edit&currentId=${movie.imdbId}`)
                      }}>
                      Edit
                    </Button>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  },
})
