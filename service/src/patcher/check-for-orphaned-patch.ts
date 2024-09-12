import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import type { PatchRunStore } from './patch-run-store.js'

export const checkForOrphanedPatch = async (injector: Injector, store: PatchRunStore) => {
  const logger = getLogger(injector).withScope('Orphaned Patch Checker')

  const toBeOrphaned = await store.find({
    filter: { status: { $eq: 'running' } },
  })

  if (toBeOrphaned.length > 0) {
    await logger.warning({
      message: `🩹  Found ${toBeOrphaned.length} patches in "Running" state. Setting them to "Orphaned"`,
    })
    await Promise.all(
      toBeOrphaned
        .map((p) => ({ ...p, status: 'orphaned' as const }))
        .map(
          async (p) =>
            await store.update(p.id, {
              ...p,
              log: [
                ...p.log,
                {
                  timestamp: new Date().toISOString(),
                  message: 'Found in running state during init. Set as "Orphaned"',
                },
              ],
            }),
        ),
    )
  }
}
