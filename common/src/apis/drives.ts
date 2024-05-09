import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetCollectionResult,
  GetEntityEndpoint,
  PatchEndpoint,
  RestApi,
} from '@furystack/rest'
import type { DirectoryEntry } from '../models/drives/directory-entry.js'
import type { Drive } from '../models/drives/drive.js'
import type { WithOptionalId } from '@furystack/core'
import type { FFProbeResult } from 'ffprobe'

export type GetDirectoryEntries = {
  url: {
    letter: string
    path: string
  }
  result: GetCollectionResult<DirectoryEntry>
}

export type UploadEndpoint = {
  result: { success: true; entries: DirectoryEntry[] }
  url: {
    letter: string
    path: string
  }
  body: any
}

export type DeleteFileEndpoint = {
  url: {
    letter: string
    path: string
  }
  result: { success: true }
}

export type DownloadEndpoint = {
  url: {
    letter: string
    path: string
  }
  result: unknown
}

export type PostDriveEndpoint = {
  body: Omit<WithOptionalId<Drive, 'letter'>, 'createdAt' | 'updatedAt'>
  result: Drive
}

export type PatchDriveEndpoint = {
  body: Partial<Omit<Drive, 'createdAt' | 'updatedAt'>>
  url: {
    id: Drive['letter']
  }
  result: {}
}

export type FfprobeEndpoint = {
  url: {
    letter: string
    path: string
  }
  result: FFProbeResult
}

export type SaveTextFileEndpoint = {
  url: {
    letter: string
    path: string
  }
  body: {
    text: string
  }
  result: {
    success: true
  }
}

export interface DrivesApi extends RestApi {
  GET: {
    '/volumes': GetCollectionEndpoint<Drive>
    '/volumes/:id': GetEntityEndpoint<Drive, 'letter'>
    '/files/:letter/:path': GetDirectoryEntries
    '/files/:letter/:path/download': DownloadEndpoint
    '/files/:letter/:path/ffprobe': FfprobeEndpoint
  }
  POST: {
    '/volumes': PostDriveEndpoint
    '/volumes/:letter/:path/upload': UploadEndpoint
  }
  PUT: {
    '/files/:letter/:path': SaveTextFileEndpoint
  }
  PATCH: {
    '/volumes/:id': PatchEndpoint<Drive, 'letter'>
  }
  DELETE: {
    '/volumes/:id': DeleteEndpoint<Drive, 'letter'>
    '/files/:letter/:path': DeleteFileEndpoint
  }
}
