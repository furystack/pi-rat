import { getCurrentUser, type PhysicalStore } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import {
  DefaultSession,
  SessionStore as FrameworkSessionStore,
  UserStore as FrameworkUserStore,
  useHttpAuthentication,
} from '@furystack/rest-service'
import {
  PasswordCredential,
  PasswordCredentialStore as FrameworkPasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore as FrameworkPasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { User as PiRatUser, type Roles } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class UserModel extends Model<PiRatUser, PiRatUser> implements PiRatUser {
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

class PasswordResetTokenModel extends Model<PasswordResetToken, PasswordResetToken> implements PasswordResetToken {
  declare userName: string
  declare token: string
  declare createdAt: string
}

class SessionModel extends Model<DefaultSession, DefaultSession> implements DefaultSession {
  declare sessionId: string
  declare username: string
}

const dbOptions = getDefaultDbSettings('identity.sqlite')

export const UserStore = defineSequelizeStore<PiRatUser, UserModel, 'username'>({
  name: 'pi-rat/UserStore',
  model: PiRatUser,
  sequelizeModel: UserModel,
  primaryKey: 'username',
  options: dbOptions,
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
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE },
      },
      { sequelize },
    )
  },
})

export const PasswordCredentialStore = defineSequelizeStore<PasswordCredential, PasswordCredentialModel, 'userName'>({
  name: 'pi-rat/PasswordCredentialStore',
  model: PasswordCredential,
  sequelizeModel: PasswordCredentialModel,
  primaryKey: 'userName',
  options: dbOptions,
  initModel: async (sequelize) => {
    PasswordCredentialModel.init(
      {
        userName: { type: DataTypes.STRING, primaryKey: true },
        passwordHash: { type: DataTypes.STRING },
        salt: { type: DataTypes.STRING },
        creationDate: { type: DataTypes.STRING },
      },
      { sequelize },
    )
  },
})

export const PasswordResetTokenStore = defineSequelizeStore<PasswordResetToken, PasswordResetTokenModel, 'token'>({
  name: 'pi-rat/PasswordResetTokenStore',
  model: PasswordResetToken,
  sequelizeModel: PasswordResetTokenModel,
  primaryKey: 'token',
  options: dbOptions,
  initModel: async (sequelize) => {
    PasswordResetTokenModel.init(
      {
        token: { type: DataTypes.STRING, primaryKey: true },
        userName: { type: DataTypes.STRING },
        createdAt: { type: DataTypes.STRING },
      },
      { sequelize },
    )
  },
})

export const SessionStore = defineSequelizeStore<DefaultSession, SessionModel, 'sessionId'>({
  name: 'pi-rat/SessionStore',
  model: DefaultSession,
  sequelizeModel: SessionModel,
  primaryKey: 'sessionId',
  options: dbOptions,
  initModel: async (sequelize) => {
    SessionModel.init(
      {
        sessionId: { type: DataTypes.STRING, primaryKey: true },
        username: { type: DataTypes.STRING },
      },
      { sequelize },
    )
  },
})

export const UserDataSet: DataSetToken<PiRatUser, 'username'> = defineDataSet({
  name: 'pi-rat/UserDataSet',
  store: UserStore,
  settings: {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeRemoveEntity: async ({ injector, entity }) => {
      const currentUser = await getCurrentUser(injector)
      if (currentUser?.username === entity.username) {
        return { isAllowed: false, message: 'Cannot remove your own account' }
      }
      return { isAllowed: true }
    },
    authorizeUpdate: withRole('admin'),
  },
})

export const PasswordCredentialDataSet: DataSetToken<PasswordCredential, 'userName'> = defineDataSet({
  name: 'pi-rat/PasswordCredentialDataSet',
  store: PasswordCredentialStore,
  settings: {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  },
})

export const PasswordResetTokenDataSet: DataSetToken<PasswordResetToken, 'token'> = defineDataSet({
  name: 'pi-rat/PasswordResetTokenDataSet',
  store: PasswordResetTokenStore,
})

export const SessionDataSet: DataSetToken<DefaultSession, 'sessionId'> = defineDataSet({
  name: 'pi-rat/SessionDataSet',
  store: SessionStore,
})

export const setupIdentity = async (injector: Injector): Promise<void> => {
  injector.bind(
    FrameworkUserStore,
    ({ inject }) => inject(UserStore) as PhysicalStore<{ username: string; roles: string[] }, 'username'>,
  )
  injector.bind(FrameworkSessionStore, ({ inject }) => inject(SessionStore))
  injector.bind(FrameworkPasswordCredentialStore, ({ inject }) => inject(PasswordCredentialStore))
  injector.bind(FrameworkPasswordResetTokenStore, ({ inject }) => inject(PasswordResetTokenStore))

  usePasswordPolicy(injector)
  useHttpAuthentication(injector, {
    enableBasicAuth: false,
    userDataSet: UserDataSet as unknown as DataSetToken<{ username: string; roles: string[] }, 'username'>,
  })

  // Force sequelize sync via store resolution
  const { SequelizeStore } = await import('@furystack/sequelize-store')
  // eslint-disable-next-line furystack/no-direct-store-token -- Need the SequelizeStore handle to trigger sequelize.sync() at bootstrap
  const userStore = injector.get(UserStore)
  if (userStore instanceof SequelizeStore) {
    const model = await userStore.getModel()
    await model.sequelize?.sync()
  }
}
