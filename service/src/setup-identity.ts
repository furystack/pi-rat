import { join } from 'path'
import { addStore, InMemoryStore } from '@furystack/core'
import { FileSystemStore } from '@furystack/filesystem-store'
import { Injector } from '@furystack/inject'
import { PasswordCredential } from '@furystack/security'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { usePasswordPolicy } from '@furystack/security'
import { User } from 'common'
import { DefaultSession } from '@furystack/rest-service'
import { authorizedDataSet } from './authorized-data-set'

export const setupIdentity = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Identity')
  logger.information({ message: '👤  Setting up Identity...' })

  addStore(
    injector,
    new FileSystemStore({
      model: User,
      primaryKey: 'username',
      tickMs: 30 * 1000,
      fileName: join(process.cwd(), 'data', 'users.json'),
    }),
  )
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(
      new FileSystemStore({
        model: PasswordCredential,
        primaryKey: 'userName',
        fileName: join(process.cwd(), 'data', 'pwc.json'),
      }),
    )

  getRepository(injector).createDataSet(User, 'username', {
    ...authorizedDataSet,
  })

  usePasswordPolicy(injector)

  logger.information({ message: '✅  Identity setup completed' })
}
