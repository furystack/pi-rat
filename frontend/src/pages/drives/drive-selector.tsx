import { createComponent, Shade } from '@furystack/shades'
import { Paper, Suggest } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesApiClient } from '../../services/drives-api-client'

export const DriveSelector = Shade({
  shadowDomName: 'drive-selector',
  render: ({ injector }) => {
    return (
      <Paper elevation={1}>
        Select Drive
        <Suggest<Drive>
          getEntries={async (options) => {
            const result = await injector.getInstance(DrivesApiClient).call({
              method: 'GET',
              action: '/volumes',
              query: {
                findOptions: {
                  top: 10,
                  filter: {
                    $or: [
                      {
                        letter: {
                          $eq: options,
                        },
                      },
                      {
                        physicalPath: {
                          $regex: options,
                        },
                      },
                    ],
                  },
                },
              },
            })

            return result.result.entries
          }}
          defaultPrefix="💾"
          getSuggestionEntry={(entry) => ({
            score: 1,
            value: <div>{entry.letter}</div>,
            element: <div>{entry.letter}</div>,
          })}
          onSelectSuggestion={(entry) => {
            console.log(entry)
          }}
        />
      </Paper>
    )
  },
})
