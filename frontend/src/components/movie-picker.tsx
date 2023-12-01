import { Shade, createComponent } from '@furystack/shades'
import { Suggest } from '@furystack/shades-common-components'
import type { Movie } from 'common'
import { MoviesService } from '../services/movies-service.js'

export const MoviePicker = Shade({
  shadowDomName: 'movie-picker',
  render: ({ injector }) => {
    const moviesService = injector.getInstance(MoviesService)
    return (
      <Suggest<Movie>
        getEntries={async (term) => {
          const result = await moviesService.findMovie({
            top: 10,
            filter: {
              $or: [{ title: { $like: `%${term}%` } }],
            },
          })
          return result.entries
        }}
        defaultPrefix=""
        getSuggestionEntry={(entry) => ({
          element: <div>{entry.title}</div>,
          score: 1,
        })}
        onSelectSuggestion={(entry) => {
          console.log(entry)
        }}
      />
    )
  },
})
