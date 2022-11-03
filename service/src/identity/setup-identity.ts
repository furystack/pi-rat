import { useSequelize } from '@furystack/sequelize-store'
import type { Injector } from '@furystack/inject'
import { PasswordCredential } from '@furystack/security'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { usePasswordPolicy } from '@furystack/security'
import { User } from 'common'
import { DefaultSession, useHttpAuthentication } from '@furystack/rest-service'
import { authorizedOnly } from '../authorized-only'
import { setupIdentityRestApi } from './setup-identity-rest-api'
import { Model, DataTypes } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options'

class UserModel extends Model<User, User> implements User {
  username!: string

  roles: string[] = []
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
  await logger.information({ message: '👤  Setting up Identity...' })

  useSequelize({
    injector,
    model: User,
    sequelizeModel: UserModel,
    primaryKey: 'username',

    options: getDefaultDbSettings('users.sqlite', logger),
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
        },
        {
          sequelize,
          modelName: 'User',
        },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: PasswordCredential,
    sequelizeModel: PasswordCredentialModel,
    primaryKey: 'userName',
    options: getDefaultDbSettings('pwc.sqlite', logger),
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
          modelName: 'PasswordCredential',
        },
      )
      await sequelize.sync()
    },
  })

  useSequelize({
    injector,
    model: DefaultSession,
    sequelizeModel: SessionModel,
    primaryKey: 'sessionId',
    options: getDefaultDbSettings('sessions.sqlite', logger),
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
          modelName: 'Session',
        },
      )
      await sequelize.sync()
    },
  })

  await logger.verbose({ message: 'Setting up repository...' })
  getRepository(injector).createDataSet(User, 'username', {
    authorizeAdd: authorizedOnly,
    authorizeGet: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeUpdate: authorizedOnly,
  })

  await logger.verbose({ message: 'Setting up password policy...' })
  usePasswordPolicy(injector)

  await logger.verbose({ message: 'Setting up HTTP Authentication...' })
  useHttpAuthentication(injector, {
    getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
  })

  await logger.verbose({ message: 'Setting up REST API...' })
  await setupIdentityRestApi(injector)

  await logger.information({ message: '✅  Identity setup completed' })
}
