export type Roles = Array<'admin'>

export class User {
  public username!: string
  roles!: Roles
  createdAt!: string
  updatedAt!: string
}
