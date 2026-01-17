import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { Config } from '../models/config/index.js'

type PostConfigEndpoint = PostEndpoint<Config, 'id', Pick<Config, 'id' | 'value'>>

type PatchConfigEndpoint = PatchEndpoint<Config, 'id', Pick<Config, 'value'>>

export interface ConfigApi extends RestApi {
  GET: {
    '/config': GetCollectionEndpoint<Config>
    '/config/:id': GetEntityEndpoint<Config, 'id'>
  }
  POST: {
    '/config': PostConfigEndpoint
  }
  PATCH: {
    '/config/:id': PatchConfigEndpoint
  }
  DELETE: {
    '/config/:id': DeleteEndpoint<Config, 'id'>
  }
}
