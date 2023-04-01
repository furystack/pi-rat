import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
} from '@furystack/rest'
import type { RestApi } from '@furystack/rest'
import type { Config } from '../models'

export interface ConfigApi extends RestApi {
  GET: {
    '/config': GetCollectionEndpoint<Config>
    '/config/:id': GetEntityEndpoint<Config, 'id'>
  }
  POST: {
    '/config': PostEndpoint<Config, 'id'>
  }
  PATCH: {
    '/config/:id': PatchEndpoint<Config, 'id'>
  }
  DELETE: {
    '/config/:id': DeleteEndpoint<Config, 'id'>
  }
}
