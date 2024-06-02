import { getStoreManager } from '@furystack/core'
import type { Patch } from './patch.js'
import { Movie, MovieFile, MovieWatchHistoryEntry } from 'common'

import type { SequelizeStore } from '@furystack/sequelize-store'
import type { Model } from 'sequelize'

export const movieFileIdInWatchProgress: Patch = {
  id: '003-movieFileId-in-watch-entry-optional-imdbId',
  description: 'As IMDB Id will be optional in movie files, replace it with movieFileId in watch progress entries',
  name: 'Movie File Id in Watch Progress Entries, optional IMDB Id in Movie Files',
  run: async (injector, addLogEntry) => {
    const sm = getStoreManager(injector)

    const movieFileStore = sm.getStoreFor(MovieFile, 'id') as SequelizeStore<MovieFile, Model<MovieFile>, 'id'>
    const movieStore = sm.getStoreFor(Movie, 'imdbId') as SequelizeStore<Movie, Model<Movie>, 'imdbId'>
    const movieFileModel = await movieFileStore.getModel()
    const movieModel = await movieStore.getModel()
    const sequelize = movieFileModel.sequelize!
    const queryInterface = sequelize.getQueryInterface()

    await sequelize.transaction(async (transaction) => {
      addLogEntry('Renaming column imdbId to movieFileId in MovieWatchHistoryEntries...')
      const watchStore = sm.getStoreFor(MovieWatchHistoryEntry, 'id') as SequelizeStore<
        MovieWatchHistoryEntry,
        Model<MovieWatchHistoryEntry>,
        'id'
      >
      const watchModel = await watchStore.getModel()
      const fields = await queryInterface.describeTable(watchModel.tableName)

      if (fields.imdbId) {
        await queryInterface.removeColumn(watchModel.tableName, 'imdbId', { transaction })
      }
      if (!fields.movieFileId) {
        await queryInterface.addColumn(
          watchModel.tableName,
          'movieFileId',
          {
            type: 'STRING',
            allowNull: false,
            references: {
              model: movieFileModel,
              key: 'id',
            },
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
          { transaction },
        )
      }

      addLogEntry('Removing required constraint from movieFile for imdbId...')

      await queryInterface.removeColumn(movieFileModel.tableName, 'imdbId', { transaction })
      await queryInterface.addColumn(
        movieFileModel.tableName,
        'imdbId',
        {
          type: 'STRING',
          allowNull: true,
          references: {
            model: movieModel,
            key: 'imdbId',
          },
        },
        { transaction },
      )
    })
  },
}
