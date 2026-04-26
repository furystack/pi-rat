import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { PasswordAuthenticator, PasswordCredentialDataSet } from '@furystack/security'
import type { ServiceStatus } from 'common'
import { UserDataSet } from '../identity/setup-identity-store.js'

export interface ServiceStatusProvider {
  getStatus(): Promise<ServiceStatus>
  install(username: string, password: string): Promise<void>
}

export const ServiceStatusProvider: Token<ServiceStatusProvider, 'singleton'> = defineService({
  name: 'pi-rat/ServiceStatusProvider',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { inject, injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const authenticator = inject(PasswordAuthenticator)
    const systemInjector = useSystemIdentityContext({ injector, username: 'service-installer' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    const getStatus = async (): Promise<ServiceStatus> => {
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const userCount = await userDataSet.count(systemInjector)
      return userCount > 0 ? 'installed' : 'needsInstall'
    }

    return {
      getStatus,
      install: async (username, password) => {
        const status = await getStatus()
        if (status === 'installed') {
          throw Error('Service is already installed')
        }
        const userDataSet = getDataSetFor(systemInjector, UserDataSet)
        const credentialDataSet = getDataSetFor(systemInjector, PasswordCredentialDataSet)

        await userDataSet.add(systemInjector, {
          username,
          roles: ['admin'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        const credential = await authenticator.hasher.createCredential(username, password)
        await credentialDataSet.add(systemInjector, credential)
        await logger.information({ message: `Service installed for user '${username}'` })
      },
    }
  },
})
