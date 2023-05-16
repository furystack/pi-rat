import type { CacheResult } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { Button, Skeleton } from '@furystack/shades-common-components'
import type { FallbackMetadata, Movie } from 'common'
import { ErrorDisplay } from '../error-display.js'
import { InstallService } from '../../services/install-service.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'

export const MovieStatus = Shade<{ movie: CacheResult<GetCollectionResult<Movie>>; metadata: FallbackMetadata }>({
  shadowDomName: 'shade-app-movie-status',
  render: ({ props, injector, useObservable }) => {
    const [serviceStatus] = useObservable(
      'serviceStatus',
      injector.getInstance(InstallService).getServiceStatusAsObservable(),
    )

    const mediaApiClient = injector.getInstance(MediaApiClient)

    const { movie, metadata } = props

    return (
      <div>
        {movie.status === 'pending' || movie.status === 'uninitialized' ? (
          <Skeleton />
        ) : movie.status === 'failed' ? (
          <ErrorDisplay error={movie.error} />
        ) : movie.status === 'loaded' ? (
          movie.value.count === 0 ? (
            <>
              Movie not yet found in database.{' '}
              {serviceStatus.status === 'loaded' && serviceStatus.value.services.omdb ? (
                <Button
                  onclick={() => {
                    /** TODO: Search on OMDB */
                    mediaApiClient.call({
                      method: 'POST',
                      action: '/omdb/movie',
                      body: {
                        title: metadata.title,
                        year: metadata.year,
                        episode: metadata.episode,
                        season: metadata.season,
                      },
                    })
                  }}>
                  Search on OMDB
                </Button>
              ) : (
                <>OMDB not available</>
              )}
            </>
          ) : (
            <>✅</>
          )
        ) : (
          'Uknown'
        )}
      </div>
    )
  },
})
