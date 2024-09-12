import { isFailedCacheResult, isLoadedCacheResult, isPendingCacheResult } from '@furystack/cache'
import { serializeToQueryString } from '@furystack/rest'
import { LazyLoad, RouteLink, Shade, createComponent } from '@furystack/shades'
import { Skeleton, promisifyAnimation } from '@furystack/shades-common-components'
import { navigateToRoute } from '../../navigate-to-route.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { SessionService } from '../../services/session.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { entityMoviesRoute } from '../routes/entity-routes.js'
import { watchMovieRoute } from '../routes/movie-routes.js'

const focus = (el: HTMLElement) => {
  void promisifyAnimation(el, [{ filter: 'saturate(0.3)brightness(0.6)' }, { filter: 'saturate(1)brightness(1)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  void promisifyAnimation(
    el.querySelector('img.cover') as HTMLImageElement,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }],
    {
      fill: 'forwards',
      easing: 'cubic-bezier(0.310, 0.805, 0.605, 1.145)',
      duration: 850,
    },
  )
}

const blur = (el: HTMLElement) => {
  void promisifyAnimation(el, [{ filter: 'saturate(1)brightness(1)' }, { filter: 'saturate(0.3)brightness(0.6)' }], {
    duration: 500,
    fill: 'forwards',
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  })
  void promisifyAnimation(
    el.querySelector('img.cover') as HTMLImageElement,
    [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { fill: 'forwards', duration: 150 },
  )
}

export const MovieWidget = Shade<{
  imdbId: string
  index?: number
  size?: number
}>({
  shadowDomName: 'pi-rat-movie-widget',
  constructed: ({ props, element }) => {
    setTimeout(() => {
      void promisifyAnimation(element.querySelector('a div'), [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        fill: 'forwards',
        delay: (props.index || 0) * 160 + Math.random() * 100,
        duration: 700,
        easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
      })
    }, 1000)
  },
  render: ({ props, injector, useObservable }) => {
    const { imdbId, size = 256 } = props

    const movieService = injector.getInstance(MoviesService)
    const movieFileService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)

    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)
    const [movie] = useObservable('movie', movieService.getMovieAsObservable(imdbId))
    const [movieFile] = useObservable(
      'movieFile',
      movieFileService.findMovieFileAsObservable({ filter: { imdbId: { $eq: imdbId } } }),
    )

    const url = `/movies/${imdbId}/overview`

    if (isLoadedCacheResult(movie)) {
      return (
        <RouteLink tabIndex={0} title={movie.value.plot || movie.value.title} href={url}>
          <div
            onfocus={(ev) => focus(ev.target as HTMLElement)}
            onblur={(ev) => blur(ev.target as HTMLElement)}
            onmouseenter={(ev) => focus(ev.target as HTMLElement)}
            onmouseleave={(ev) => blur(ev.target as HTMLElement)}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: `${size}px`,
              height: `${size}px`,
              filter: 'saturate(0.3)brightness(0.6)',
              background: 'rgba(128,128,128,0.1)',
              transform: 'scale(0)',
              borderRadius: '4px',
              margin: '8px',
              overflow: 'hidden',
              color: 'white',
            }}
            onclick={(ev) => {
              if (url.startsWith('http') && new URL(url).href !== window.location.href) {
                ev.preventDefault()
                ev.stopImmediatePropagation()
                window.location.replace(url)
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                zIndex: '1',
                fontSize: '1.3em',
                width: 'calc(100% - 2em)',
                display: 'flex',
                margin: '1em',
                justifyContent: 'space-between',
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
                      navigateToRoute(injector, watchMovieRoute, { id: movieFile.value.entries[0].id })
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
                        entityMoviesRoute,
                        {},
                        serializeToQueryString({ gedst: { mode: 'edit', currentId: imdbId } }),
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
              src={movie.value.thumbnailImageUrl as string}
              alt={movie.value.title}
              className="cover"
              style={{
                display: 'inline-block',
                backgroundColor: '#666',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                transform: 'scale(1)',
              }}
            />
            <div
              style={{
                width: 'calc(100% - 2em)',
                overflow: 'hidden',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                position: 'absolute',
                bottom: '0',
                whiteSpace: 'nowrap',
                padding: '1em',
                background: 'rgba(0,0,0,0.7)',
              }}
            >
              {movie.value.title}
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
                    Math.round(100 * (lastRecentWatchProgress.watchedSeconds / (movie.value.duration || Infinity)))

                  return (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        height: '2px',
                        width: `${percent}%`,
                        background: 'rgba(96,96,255,0.5)',
                      }}
                    />
                  )
                }}
              />
            </div>
          </div>
        </RouteLink>
      )
    } else if (isPendingCacheResult(movie)) {
      return <Skeleton />
    } else if (isFailedCacheResult(movie)) {
      return <>:(</>
    }

    return null
  },
})
