import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { LoggerCollection } from '@furystack/logging'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import type { ServiceStatus } from 'common'
import { User } from 'common'

@Injectable()
export class ServiceStatusProvider {
  public async getStatus(): Promise<ServiceStatus> {
    const userCount = await this.storeManager.getStoreFor(User, 'username').count()
    return userCount > 0 ? 'installed' : 'needsInstall'
  }

  public async install(username: string, password: string): Promise<void> {
    const status = await this.getStatus()
    if (status === 'installed') {
      throw Error('Service is already installed')
    }
    await this.storeManager.getStoreFor(User, 'username').add({
      username,
      roles: ['admin'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const credential = await this.authenticator.hasher.createCredential(username, password)
    await this.storeManager.getStoreFor(PasswordCredential, 'userName').add(credential)
    await this.logger
      .withScope(this.constructor.name)
      .information({ message: `Service installed for user '${username}'` })
  }

  @Injected(StoreManager)
  public declare storeManager: StoreManager

  @Injected(PasswordAuthenticator)
  public declare authenticator: PasswordAuthenticator

  @Injected(LoggerCollection)
  public declare logger: LoggerCollection
}
