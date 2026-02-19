import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import type { PatchRunStore } from './patch-run-store.js'
import type { Patch } from './patch.js'

export const runPatch = async (injector: Injector, patch: Patch, patchRunDataSet: PatchRunStore) => {
  const logger = getLogger(injector).withScope('Patch Runner')

  const alreadyRun = await patchRunDataSet.find(injector, {
    filter: { patchId: { $eq: patch.id } },
    top: 1,
  })

  if (alreadyRun.some((p) => p.status === 'success')) {
    await logger.verbose({ message: `📦  Patch ${patch.id} has already been applied.` })
    return
  }

  if (alreadyRun.some((p) => p.status === 'running')) {
    await logger.verbose({ message: `📦  Patch ${patch.id} is already running.` })
    return
  }

  if (alreadyRun.some((p) => p.status === 'failed')) {
    await logger.warning({ message: `📦  Patch ${patch.id} has been failed recently. Watch out.` })
  }

  await logger.verbose({ message: `📦  Running patch ${patch.id}...` })

  const { created } = await patchRunDataSet.add(injector, {
    patchId: patch.id,
    name: patch.name,
    description: patch.description,
    status: 'running',
    log: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const newPatchRun = created[0]

  try {
    await patch.run(injector, (message) => {
      newPatchRun.log.push({ timestamp: new Date().toISOString(), message })
    })
    await patchRunDataSet.update(injector, newPatchRun.id, {
      status: 'success',
      log: newPatchRun.log,
    })
    await logger.verbose({ message: `📦  Patch ${patch.id} completed.` })
  } catch (error) {
    await logger.error({ message: `📦  Patch ${patch.id} failed.`, data: { error } })
    await patchRunDataSet.update(injector, newPatchRun.id, {
      status: 'failed',
      log: [
        ...newPatchRun.log,
        {
          timestamp: new Date().toISOString(),
          message: `Patch failed. Error: ${(error as Error).message}, stack: ${(error as Error).stack}`,
        },
      ],
    })
    throw error
  }
}
