import { describe, expect, it } from 'vitest'
import { AVAILABLE_ROLES, getAllRoleDefinitions, getRoleDefinition } from './roles.js'

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

    it.each([
      ['admin', 'Application Admin', 'Full system access including user management and all settings'],
      ['media-manager', 'Media Manager', 'Can manage movies, series, and encoding tasks'],
      ['viewer', 'Viewer', 'Can browse and watch media content'],
      ['iot-manager', 'IoT Manager', 'Can manage IoT devices and their settings'],
    ] as const)('should have correct metadata for %s role', (role, displayName, description) => {
      expect(AVAILABLE_ROLES[role]).toEqual({ displayName, description })
    })
  })

  describe('getRoleDefinition', () => {
    it.each([
      ['admin', 'Application Admin', 'Full system access including user management and all settings'],
      ['media-manager', 'Media Manager', 'Can manage movies, series, and encoding tasks'],
      ['viewer', 'Viewer', 'Can browse and watch media content'],
      ['iot-manager', 'IoT Manager', 'Can manage IoT devices and their settings'],
    ] as const)('should return correct definition for %s role', (name, displayName, description) => {
      const definition = getRoleDefinition(name)
      expect(definition).toEqual({ name, displayName, description })
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
