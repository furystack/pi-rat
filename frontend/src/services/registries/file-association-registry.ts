import { Injectable } from '@furystack/inject'

export type FileAssociation = {
  extensions: string[]
  handler: string
  component: (props: { letter: string; path: string }) => JSX.Element
}

@Injectable({ lifetime: 'singleton' })
export class FileAssociationRegistry {
  private associations: FileAssociation[] = []

  public registerAssociation(association: FileAssociation) {
    this.associations.push(association)
  }

  public getAssociationForFile(path: string): FileAssociation | undefined {
    const extension = path.split('.').pop()?.toLowerCase()
    if (!extension) return undefined
    return this.associations.find((a) => a.extensions.includes(extension))
  }
}
