import { join } from 'path'
import { addStore } from '@furystack/core'
import { FileSystemStore } from '@furystack/filesystem-store'
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

export const setupIdentity = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Identity')
  logger.information({ message: '👤  Setting up Identity...' })

  addStore(
    injector,
    new FileSystemStore({
      model: User,
      primaryKey: 'username',
      fileName: join(getDataFolder(), 'users.json'),
    }),
  )
    .addStore(
      new FileSystemStore({
        model: DefaultSession,
        primaryKey: 'sessionId',
        fileName: join(getDataFolder(), 'sessions.json'),
      }),
    )
    .addStore(
      new FileSystemStore({
        model: PasswordCredential,
        primaryKey: 'userName',
        fileName: join(getDataFolder(), 'pwc.json'),
      }),
    )

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
