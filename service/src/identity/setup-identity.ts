import { getCurrentUser } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { DefaultSession, useHttpAuthentication } from '@furystack/rest-service'
import { PasswordCredential, usePasswordPolicy } from '@furystack/security'
import { useSequelize } from '@furystack/sequelize-store'
import { User, type Roles } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../authorization/with-role.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'

class UserModel extends Model<User, User> implements User {
  declare username: string

  declare roles: Roles

  declare createdAt: string

  declare updatedAt: string
}

class PasswordCredentialModel extends Model<PasswordCredential, PasswordCredential> implements PasswordCredential {
  declare userName: string
  declare passwordHash: string
  declare salt: string
  declare creationDate: string
}

class SessionModel extends Model<DefaultSession, DefaultSession> implements DefaultSession {
  declare sessionId: string
  declare username: string
}

export const setupIdentity = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Identity')
  await logger.verbose({ message: '👤  Setting up Identity stores and repository...' })

  const options = getDefaultDbSettings('identity.sqlite', logger)

  useSequelize({
    injector,
    model: User,
    sequelizeModel: UserModel,
    primaryKey: 'username',

    options,
    initModel: async (sequelize) => {
      UserModel.init(
        {
          username: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          roles: {
            type: DataTypes.JSON,
            defaultValue: [],
          },
          createdAt: {
            type: DataTypes.DATE,
          },
          updatedAt: {
            type: DataTypes.DATE,
          },
        },
        {
          sequelize,
        },
      )
    },
  })

  useSequelize({
    injector,
    model: PasswordCredential,
    sequelizeModel: PasswordCredentialModel,
    primaryKey: 'userName',
    options,
    initModel: async (sequelize) => {
      PasswordCredentialModel.init(
        {
          userName: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          passwordHash: {
            type: DataTypes.STRING,
          },
          salt: {
            type: DataTypes.STRING,
          },
          creationDate: {
            type: DataTypes.STRING,
          },
        },
        {
          sequelize,
        },
      )
      // await PasswordCredentialModel.sync()
    },
  })

  useSequelize({
    injector,
    model: DefaultSession,
    sequelizeModel: SessionModel,
    primaryKey: 'sessionId',
    options,
    initModel: async (sequelize) => {
      SessionModel.init(
        {
          sessionId: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          username: {
            type: DataTypes.STRING,
          },
        },
        {
          sequelize,
        },
      )
      // await SessionModel.sync()
    },
  })

  await logger.verbose({ message: 'Setting up repository...' })
  getRepository(injector).createDataSet(User, 'username', {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authroizeRemoveEntity: async (args) => {
      const currentUser = await getCurrentUser(args.injector)
      if (currentUser?.username === args.entity.username) {
        return { isAllowed: false, message: 'Cannot remove your own account' }
      }
      return { isAllowed: true }
    },
    authorizeUpdate: withRole('admin'),
  })

  await logger.verbose({ message: 'Setting up password policy...' })
  usePasswordPolicy(injector)

  await logger.verbose({ message: 'Setting up HTTP Authentication...' })
  useHttpAuthentication(injector, {
    getUserStore: (sm) => sm.getStoreFor(User, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
    enableBasicAuth: false,
  })
  await logger.verbose({ message: '✅  Identity stores and repo setup completed' })
}
