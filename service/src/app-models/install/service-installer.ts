import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { LoggerCollection } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import type { ServiceStatus } from 'common'
import { User } from 'common'

@Injectable()
export class ServiceStatusProvider {
  public async getStatus(): Promise<ServiceStatus> {
    const userCount = await this.userDataSet.count(this.systemInjector)
    return userCount > 0 ? 'installed' : 'needsInstall'
  }

  public async install(username: string, password: string): Promise<void> {
    const status = await this.getStatus()
    if (status === 'installed') {
      throw Error('Service is already installed')
    }
    await this.userDataSet.add(this.systemInjector, {
      username,
      roles: ['admin'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const credential = await this.authenticator.hasher.createCredential(username, password)
    await this.credentialDataSet.add(this.systemInjector, credential)
    await this.logger
      .withScope(this.constructor.name)
      .information({ message: `Service installed for user '${username}'` })
  }

  @Injected((injector) => getDataSetFor(injector, User, 'username'))
  declare private userDataSet: DataSet<User, 'username'>

  @Injected((injector) => getDataSetFor(injector, PasswordCredential, 'userName'))
  declare private credentialDataSet: DataSet<PasswordCredential, 'userName'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'service-installer' }))
  declare private systemInjector: Injector

  @Injected(PasswordAuthenticator)
  declare public authenticator: PasswordAuthenticator

  @Injected(LoggerCollection)
  declare public logger: LoggerCollection
}
