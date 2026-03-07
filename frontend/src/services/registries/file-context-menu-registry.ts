import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { ContextMenuItem } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'

export type FileContextMenuContribution = {
  isApplicable: (entry: DirectoryEntry, driveLetter: string, path: string) => boolean
  getItems: (ctx: {
    entry: DirectoryEntry
    driveLetter: string
    path: string
    injector: Injector
  }) => Array<ContextMenuItem<() => void>>
  getComponents?: (ctx: {
    entry: DirectoryEntry
    driveLetter: string
    path: string
    injector: Injector
  }) => JSX.Element | null
}

@Injectable({ lifetime: 'singleton' })
export class FileContextMenuRegistry {
  private contributions: FileContextMenuContribution[] = []

  public registerContribution(contribution: FileContextMenuContribution) {
    this.contributions.push(contribution)
  }

  public getContributions(entry: DirectoryEntry, driveLetter: string, path: string): FileContextMenuContribution[] {
    return this.contributions.filter((c) => c.isApplicable(entry, driveLetter, path))
  }
}
