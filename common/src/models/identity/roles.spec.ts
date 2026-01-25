import { describe, expect, it } from 'vitest'
import { AVAILABLE_ROLES, getAllRoleDefinitions, getRoleDefinition } from './roles.js'
import type { Roles } from './user.js'

describe('roles', () => {
  describe('AVAILABLE_ROLES', () => {
    it('should contain all 4 roles', () => {
      const roleNames = Object.keys(AVAILABLE_ROLES)

      expect(roleNames).toHaveLength(4)
      expect(roleNames).toContain('admin')
      expect(roleNames).toContain('media-manager')
      expect(roleNames).toContain('viewer')
      expect(roleNames).toContain('iot-manager')
    })

    it('should have displayName for each role', () => {
      for (const role of Object.values(AVAILABLE_ROLES)) {
        expect(role.displayName).toBeDefined()
        expect(typeof role.displayName).toBe('string')
        expect(role.displayName.length).toBeGreaterThan(0)
      }
    })

    it('should have description for each role', () => {
      for (const role of Object.values(AVAILABLE_ROLES)) {
        expect(role.description).toBeDefined()
        expect(typeof role.description).toBe('string')
        expect(role.description.length).toBeGreaterThan(0)
      }
    })

    it('should have correct metadata for admin role', () => {
      expect(AVAILABLE_ROLES.admin).toEqual({
        displayName: 'Application Admin',
        description: 'Full system access including user management and all settings',
      })
    })

    it('should have correct metadata for media-manager role', () => {
      expect(AVAILABLE_ROLES['media-manager']).toEqual({
        displayName: 'Media Manager',
        description: 'Can manage movies, series, and encoding tasks',
      })
    })

    it('should have correct metadata for viewer role', () => {
      expect(AVAILABLE_ROLES.viewer).toEqual({
        displayName: 'Viewer',
        description: 'Can browse and watch media content',
      })
    })

    it('should have correct metadata for iot-manager role', () => {
      expect(AVAILABLE_ROLES['iot-manager']).toEqual({
        displayName: 'IoT Manager',
        description: 'Can manage IoT devices and their settings',
      })
    })
  })

  describe('getRoleDefinition', () => {
    it('should return correct definition for admin role', () => {
      const definition = getRoleDefinition('admin')

      expect(definition).toEqual({
        name: 'admin',
        displayName: 'Application Admin',
        description: 'Full system access including user management and all settings',
      })
    })

    it('should return correct definition for media-manager role', () => {
      const definition = getRoleDefinition('media-manager')

      expect(definition).toEqual({
        name: 'media-manager',
        displayName: 'Media Manager',
        description: 'Can manage movies, series, and encoding tasks',
      })
    })

    it('should return correct definition for viewer role', () => {
      const definition = getRoleDefinition('viewer')

      expect(definition).toEqual({
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Can browse and watch media content',
      })
    })

    it('should return correct definition for iot-manager role', () => {
      const definition = getRoleDefinition('iot-manager')

      expect(definition).toEqual({
        name: 'iot-manager',
        displayName: 'IoT Manager',
        description: 'Can manage IoT devices and their settings',
      })
    })

    it('should include name, displayName, and description for each role', () => {
      const roles: Array<Roles[number]> = ['admin', 'media-manager', 'viewer', 'iot-manager']

      for (const roleName of roles) {
        const definition = getRoleDefinition(roleName)

        expect(definition.name).toBe(roleName)
        expect(definition.displayName).toBeDefined()
        expect(definition.description).toBeDefined()
      }
    })
  })

  describe('getAllRoleDefinitions', () => {
    it('should return array of all 4 role definitions', () => {
      const definitions = getAllRoleDefinitions()

      expect(definitions).toHaveLength(4)
    })

    it('should include all role names', () => {
      const definitions = getAllRoleDefinitions()
      const names = definitions.map((d) => d.name)

      expect(names).toContain('admin')
      expect(names).toContain('media-manager')
      expect(names).toContain('viewer')
      expect(names).toContain('iot-manager')
    })

    it('should have all required properties for each definition', () => {
      const definitions = getAllRoleDefinitions()

      for (const definition of definitions) {
        expect(definition).toHaveProperty('name')
        expect(definition).toHaveProperty('displayName')
        expect(definition).toHaveProperty('description')
        expect(typeof definition.name).toBe('string')
        expect(typeof definition.displayName).toBe('string')
        expect(typeof definition.description).toBe('string')
      }
    })

    it('should return definitions that match getRoleDefinition for each role', () => {
      const definitions = getAllRoleDefinitions()

      for (const definition of definitions) {
        const singleDefinition = getRoleDefinition(definition.name)
        expect(definition).toEqual(singleDefinition)
      }
    })
  })
})
