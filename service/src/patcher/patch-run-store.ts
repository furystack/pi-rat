import type { PhysicalStore } from '@furystack/core'
import type { PatchRun } from 'common'

export type PatchRunStore = PhysicalStore<
  PatchRun,
  'id',
  Pick<PatchRun, 'name' | 'description' | 'patchId' | 'status' | 'log'>
>
