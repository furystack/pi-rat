import { join } from 'path'
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
import { getDataFolder } from '../get-data-folder'
import { Model, DataTypes } from 'sequelize'

class UserModel extends Model<User, User> implements User {
  username!: string

  roles: string[] = []
}

class PasswordCredentialModel extends Model<PasswordCredential, PasswordCredential> implements PasswordCredential {
  userName!: string
  passwordHash!: string
  salt!: string
  creationDate!: string
}

class SessionModel extends Model<DefaultSession, DefaultSession> implements DefaultSession {
  sessionId!: string
  username!: string
}

export const setupIdentity = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Identity')
  logger.information({ message: '👤  Setting up Identity...' })

  useSequelize({
    injector,
    model: User,
    sequelizeModel: UserModel,
    primaryKey: 'username',
    options: {
      dialect: 'sqlite',
      storage: join(getDataFolder(), 'users.sqlite'),
    },
    initModel: async (sequelize) => {
      UserModel.init(
        {
          username: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          roles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
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
    options: {
      dialect: 'sqlite',
      storage: join(getDataFolder(), 'pwc.sqlite'),
    },
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
    options: {
      dialect: 'sqlite',
      storage: join(getDataFolder(), 'sessions.sqlite'),
    },
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

  getRepository(injector).createDataSet(User, 'username', {
    authorizeAdd: authorizedOnly,
    authorizeGet: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeUpdate: authorizedOnly,
  })

  usePasswordPolicy(injector)

  useHttpAuthentication(injector, {
    getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
  })

  await setupIdentityRestApi(injector)

  logger.information({ message: '✅  Identity setup completed' })
}
