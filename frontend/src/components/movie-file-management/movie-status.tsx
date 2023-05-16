import type { CacheResult } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { Button, Skeleton } from '@furystack/shades-common-components'
import type { Movie } from 'common'
import { ErrorDisplay } from '../error-display.js'
import { InstallService } from '../../services/install-service.js'

export const MovieStatus = Shade<{ status: CacheResult<GetCollectionResult<Movie>> }>({
  shadowDomName: 'shade-app-movie-status',
  render: ({ props, injector, useObservable }) => {
    const [serviceStatus] = useObservable(
      'serviceStatus',
      injector.getInstance(InstallService).getServiceStatusAsObservable(),
    )

    const movie = props.status

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
