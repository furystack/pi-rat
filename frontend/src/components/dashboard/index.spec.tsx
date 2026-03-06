import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import type { Dashboard as DashboardData, User } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionService } from '../../services/session.js'
import { Dashboard } from './index.js'

vi.mock('../../navigate-to-route.js', () => ({
  navigateToRoute: vi.fn(),
}))

const createMockDashboard = (overrides?: Partial<DashboardData>): DashboardData => ({
  id: 'dashboard-1',
  name: 'Test Dashboard',
  owner: 'test-owner',
  description: 'Test description',
  widgets: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('Dashboard', () => {
  let injector: Injector
  let currentUserObservable: ObservableValue<Pick<User, 'username' | 'roles'> | null>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    currentUserObservable = new ObservableValue<Pick<User, 'username' | 'roles'> | null>({
      username: 'test-owner',
      roles: [],
    })

    const mockSessionService = {
      currentUser: currentUserObservable,
    }

    injector = new Injector()
    injector.setExplicitInstance(mockSessionService as unknown as SessionService, SessionService)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
  })

  it('should render the dashboard component', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const el = document.querySelector('pi-rat-dashboard')
    expect(el).toBeTruthy()
  })

  it('should render widgets', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard({
      widgets: [
        { type: 'html', content: '<p>Hello</p>' },
        { type: 'html', content: '<p>World</p>' },
      ],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const widgets = document.querySelectorAll('pi-rat-widget')
    expect(widgets.length).toBe(2)
  })

  it('should show edit context menu item when current user is the dashboard owner', async () => {
    currentUserObservable.setValue({ username: 'test-owner', roles: [] })

    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard({ owner: 'test-owner' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const el = document.querySelector('pi-rat-dashboard')
    const contextTarget = el?.querySelector('div') as HTMLElement
    expect(contextTarget).toBeTruthy()

    contextTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }))
    await flushUpdates()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    const contextMenu = document.querySelector('shade-context-menu')
    expect(contextMenu?.textContent).toContain('Edit this dashboard')
  })

  it('should show edit context menu item when current user is an admin', async () => {
    currentUserObservable.setValue({ username: 'other-user', roles: ['admin'] })

    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard({ owner: 'test-owner' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const el = document.querySelector('pi-rat-dashboard')
    const contextTarget = el?.querySelector('div') as HTMLElement
    contextTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }))
    await flushUpdates()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    const contextMenu = document.querySelector('shade-context-menu')
    expect(contextMenu?.textContent).toContain('Edit this dashboard')
  })

  it('should not show edit context menu item when current user is not owner or admin', async () => {
    currentUserObservable.setValue({ username: 'other-user', roles: [] })

    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard({ owner: 'test-owner' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const el = document.querySelector('pi-rat-dashboard')
    const contextTarget = el?.querySelector('div') as HTMLElement

    contextTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }))
    await flushUpdates()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    const contextMenu = document.querySelector('shade-context-menu')
    expect(contextMenu?.textContent).not.toContain('Edit this dashboard')
  })

  it('should not show edit context menu item when user is not logged in', async () => {
    currentUserObservable.setValue(null)

    const rootElement = document.getElementById('root') as HTMLDivElement
    const dashboard = createMockDashboard()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Dashboard {...dashboard} />,
    })
    await flushUpdates()

    const el = document.querySelector('pi-rat-dashboard')
    const contextTarget = el?.querySelector('div') as HTMLElement

    contextTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }))
    await flushUpdates()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    const contextMenu = document.querySelector('shade-context-menu')
    expect(contextMenu?.textContent).not.toContain('Edit this dashboard')
  })
})
