export type Roles = Array<'admin' | 'media-manager' | 'viewer' | 'iot-manager'>

export class User {
  public username!: string
  roles!: Roles
  createdAt!: string
  updatedAt!: string
}
