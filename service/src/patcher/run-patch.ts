import type { Injector } from '@furystack/inject'
import type { Patch } from './patch.js'
import { getLogger } from '@furystack/logging'
import type { PatchRunStore } from './patch-run-store.js'

export const runPatch = async (injector: Injector, patch: Patch, patchRunStore: PatchRunStore) => {
  const logger = getLogger(injector).withScope('Patch Runner')

  const alreadyRun = await patchRunStore.find({
    filter: { patchId: { $eq: patch.id } },
    top: 1,
  })

  if (alreadyRun.some((p) => p.status === 'success')) {
    logger.verbose({ message: `📦  Patch ${patch.id} has already been applied.` })
    return
  }

  if (alreadyRun.some((p) => p.status === 'running')) {
    logger.verbose({ message: `📦  Patch ${patch.id} is already running.` })
    return
  }

  if (alreadyRun.some((p) => p.status === 'failed')) {
    logger.warning({ message: `📦  Patch ${patch.id} has been failed recently. Watch out.` })
  }

  await logger.verbose({ message: `📦  Running patch ${patch.id}...` })

  const { created } = await patchRunStore.add({
    patchId: patch.id,
    name: patch.name,
    description: patch.description,
    status: 'running',
    log: [],
  })

  const newPatchRun = created[0]

  try {
    await patch.run(injector, (message) => {
      newPatchRun.log.push({ timestamp: new Date().toISOString(), message })
    })
    await patchRunStore.update(newPatchRun.id, {
      status: 'success',
      log: newPatchRun.log,
    })
    await logger.verbose({ message: `📦  Patch ${patch.id} completed.` })
  } catch (error) {
    await logger.error({ message: `📦  Patch ${patch.id} failed.`, data: { error } })
    await patchRunStore.update(newPatchRun.id, {
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
