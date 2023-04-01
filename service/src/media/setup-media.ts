import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'

import { MovieLibrary, MovieWatchHistoryEntry, Movie, Series } from 'common'
import { OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { getDefaultDbSettings } from '../get-default-db-options'
import { DataTypes, Model } from 'sequelize'
import { useSequelize } from '@furystack/sequelize-store'
import type { AuthorizationResult } from '@furystack/repository'
import { getRepository } from '@furystack/repository'
import { authorizedOnly } from '../authorization/authorized-only'
import { withRole } from '../authorization/with-role'
import { getCurrentUser, isAuthorized } from '@furystack/core'

class MovieLibraryModel extends Model<MovieLibrary, MovieLibrary> implements MovieLibrary {
  declare id: string
  declare icon: string
  declare name: string
  declare driveLetter: string
  declare owner: string
  declare createdAt: string
  declare updatedAt: string
}

class MovieModel extends Model<Movie, Movie> implements Movie {
  declare id: string
  declare movieLibraryId: string
  declare movieLibrary: MovieLibrary
  declare path: string
  declare title: string
  declare imdbId?: string | undefined
  declare year?: number | undefined
  declare duration?: number | undefined
  declare genre?: string[] | undefined
  declare thumbnailImageUrl?: string | undefined
  declare plot?: string | undefined
  declare type?: 'episode' | 'movie' | undefined
  declare seriesId?: string | undefined
  declare season?: number | undefined
  declare episode?: number | undefined
  declare createdAt: string
  declare updatedAt: string
}

class MovieWatchHistoryEntryModel
  extends Model<MovieWatchHistoryEntry, MovieWatchHistoryEntry>
  implements MovieWatchHistoryEntry
{
  declare id: string
  declare userName: string
  declare movieId: string
  declare movie: Movie
  declare startDate: Date
  declare lastWatchDate: Date
  declare watchedSeconds: number
  declare completed: boolean
  declare createdAt: string
  declare updatedAt: string
}

class SeriesModel extends Model<Series, Series> implements Series {
  declare id: string
  declare imdbId: string
  declare title: string
  declare year: string
  declare thumbnailImageUrl?: string | undefined
  declare plot: string
  declare createdAt: string
  declare updatedAt: string
}

class OmdbMovieMetadataModel extends Model<OmdbMovieMetadata, OmdbMovieMetadata> implements OmdbMovieMetadata {
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: 'episode' | 'movie'
  DVD?: string | undefined
  BoxOffice?: string | undefined
  Production?: string | undefined
  Website?: string | undefined
  declare Response: 'True'
  Season?: string | undefined
  Episode?: string | undefined
  declare createdAt: string
  declare updatedAt: string
}

class OmdbSeriesMetadataModel extends Model<OmdbSeriesMetadata, OmdbSeriesMetadata> implements OmdbSeriesMetadata {
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: string
  declare totalSeasons: string
  declare Response: string
  declare createdAt: string
  declare updatedAt: string
}

export const setupMovies = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Movies')

  logger.verbose({ message: '🎥  Setting up Media store and repository...' })

  const dbOptions = getDefaultDbSettings('movies', logger)

  useSequelize({
    injector,
    model: MovieLibrary,
    sequelizeModel: MovieLibraryModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      MovieLibraryModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          driveLetter: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          icon: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          owner: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: Movie,
    sequelizeModel: MovieModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      MovieModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          path: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          movieLibraryId: {
            type: DataTypes.UUIDV4,
            references: {
              model: MovieLibraryModel,
              key: 'id',
            },
            allowNull: false,
            onDelete: 'CASCADE',
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
          },
          duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          year: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          genre: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
          },
          episode: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          season: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          plot: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          thumbnailImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          type: {
            type: DataTypes.ENUM('episode', 'movie'),
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: MovieWatchHistoryEntry,
    sequelizeModel: MovieWatchHistoryEntryModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      MovieWatchHistoryEntryModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          userName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          movieId: {
            type: DataTypes.UUIDV4,
            references: {
              model: MovieModel,
              key: 'id',
            },
            allowNull: false,
            onDelete: 'CASCADE',
          },
          startDate: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          lastWatchDate: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          watchedSeconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: Series,
    sequelizeModel: SeriesModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      SeriesModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          imdbId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          thumbnailImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: OmdbMovieMetadata,
    sequelizeModel: OmdbMovieMetadataModel,
    primaryKey: 'imdbID',
    options: dbOptions,
    initModel: async (sequelize) => {
      OmdbMovieMetadataModel.init(
        {
          imdbID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
          },
          Title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Rated: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Released: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Runtime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Genre: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Director: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Writer: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Actors: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Language: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Country: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Awards: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Poster: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Ratings: {
            type: DataTypes.JSON,
            allowNull: false,
          },
          Metascore: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbRating: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbVotes: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Response: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          DVD: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          BoxOffice: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Production: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Episode: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Season: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Website: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: OmdbSeriesMetadata,
    sequelizeModel: OmdbSeriesMetadataModel,
    primaryKey: 'imdbID',
    options: dbOptions,
    initModel: async (sequelize) => {
      OmdbSeriesMetadataModel.init(
        {
          imdbID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
          },
          Title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Actors: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Awards: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Country: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Director: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Genre: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbRating: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbVotes: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Language: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Poster: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Metascore: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Rated: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Released: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Response: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Runtime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Ratings: {
            type: DataTypes.JSON,
            allowNull: false,
          },
          totalSeasons: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Writer: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  const repo = getRepository(injector)

  repo.createDataSet(MovieLibrary, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(Movie, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  const onlyOwned = async ({
    entity,
    injector: i,
  }: {
    entity: MovieWatchHistoryEntry
    injector: Injector
  }): Promise<AuthorizationResult> => {
    const user = await getCurrentUser(i)
    if (user.username === entity.userName) {
      return { isAllowed: true }
    }

    if (await isAuthorized(i, 'admin')) {
      return { isAllowed: true }
    }
    return {
      isAllowed: false,
      message: 'You are not authorized to access this resource',
    }
  }

  repo.createDataSet(MovieWatchHistoryEntry, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: authorizedOnly,
    authorizeUpdate: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeGetEntity: onlyOwned,
    addFilter: async ({ filter, injector: i }) => {
      const user = await getCurrentUser(i)
      const isAdmin = await isAuthorized(i, 'admin')
      if (isAdmin) {
        return filter
      }
      return {
        ...filter,
        filter: {
          ...filter.filter,
          userName: { $eq: user.username },
        },
      }
    },
    authorizeUpdateEntity: onlyOwned,
    authroizeRemoveEntity: onlyOwned,
  })

  repo.createDataSet(Series, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbMovieMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbSeriesMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  logger.verbose({ message: '✅  Media setup completed' })
}
