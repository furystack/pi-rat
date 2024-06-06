import { getCurrentUser } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { SaveWatchProgress } from 'common'
import { WatchHistoryEntry } from 'common'

export const SaveWatchProgressAction: RequestAction<SaveWatchProgress> = async ({ injector, getBody }) => {
  const { completed, driveLetter, path, watchedSeconds } = await getBody()

  const dataSet = getDataSetFor(injector, WatchHistoryEntry, 'id')

  const [existing] = await dataSet.find(injector, {
    filter: {
      driveLetter: { $eq: driveLetter },
      path: { $eq: path },
    },
  })

  if (existing) {
    await dataSet.update(injector, existing.id, {
      watchedSeconds,
      completed,
    })
    const reloaded = await dataSet.get(injector, existing.id)
    return JsonResult(reloaded as WatchHistoryEntry)
  } else {
    const user = await getCurrentUser(injector)
    const {
      created: [added],
    } = await dataSet.add(injector, {
      userName: user.username,
      driveLetter,
      path,
      watchedSeconds,
      completed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return JsonResult(added)
  }
}
