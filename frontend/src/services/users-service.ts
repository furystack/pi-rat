import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { Roles, User } from 'common'
import { IdentityApiClient } from './api-clients/identity-api-client.js'

class UsersServiceImpl implements Disposable {
  public userCache = new Cache({
    capacity: 100,
    load: async (username: string) => {
      const { result } = await this.identityApiClient.call({
        method: 'GET',
        action: '/users/:id',
        url: { id: username },
        query: {},
      })
      return result
    },
  })

  public userQueryCache = new Cache({
    capacity: 10,
    load: async (findOptions: FindOptions<User, Array<keyof User>>) => {
      const { result } = await this.identityApiClient.call({
        method: 'GET',
        action: '/users',
        query: { findOptions },
      })

      result.entries.forEach((entry) => {
        this.userCache.setExplicitValue({
          loadArgs: [entry.username],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  constructor(private readonly identityApiClient: IdentityApiClient) {}

  public getUser = this.userCache.get.bind(this.userCache)
  public getUserAsObservable = this.userCache.getObservable.bind(this.userCache)
  public findUsers = this.userQueryCache.get.bind(this.userQueryCache)
  public findUsersAsObservable = this.userQueryCache.getObservable.bind(this.userQueryCache)

  public updateUser = async (username: string, body: { username: string; roles: Roles }) => {
    const { result } = await this.identityApiClient.call({
      method: 'PATCH',
      action: '/users/:id',
      url: { id: username },
      body,
    })
    void this.userCache.reload(username)
    this.userQueryCache.flushAll()
    return result
  }

  public deleteUser = async (username: string) => {
    await this.identityApiClient.call({
      method: 'DELETE',
      action: '/users/:id',
      url: { id: username },
    })
    this.userCache.remove(username)
    this.userQueryCache.flushAll()
  }

  public [Symbol.dispose](): void {
    this.userCache[Symbol.dispose]()
    this.userQueryCache[Symbol.dispose]()
  }
}

export type UsersService = UsersServiceImpl

export const UsersService: Token<UsersService, 'singleton'> = defineService({
  name: 'pi-rat/UsersService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new UsersServiceImpl(inject(IdentityApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
