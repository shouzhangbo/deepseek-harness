// @vitest-environment jsdom
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import { Context, Service } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { usePinnedBrowserLanguages } from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply, inject, NS } from '../src/client/index.ts'
import { McpSettingsTab } from '../src/client/McpSettingsTab.tsx'
import { SkillsSettingsTab } from '../src/client/SkillsSettingsTab.tsx'
import { entryTitle } from '../src/client/mcp-view.ts'
import type { McpScope } from '../src/client/mcp-view.ts'
import { en, zh } from '../src/client/locales.ts'
import { apply as hostApply } from '../src/index.ts'

usePinnedBrowserLanguages('zh-CN')
afterEach(cleanup)

type RemoteResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } }

interface ListRow { readonly id: string; readonly retainedBy: { readonly mainView?: number } }

type SessionsSnapshot = { readonly byId: Readonly<Record<string, ListRow>> }

type InventoryValue = {
  readonly entries: readonly unknown[]
  readonly agentPresets?: readonly unknown[]
}

async function bench() {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  class RemoteService extends Service {
    constructor(serviceCtx: Context) {
      super(serviceCtx, 'remote')
    }
  }
  new RemoteService(ctx)
  const sessionsStore = createSnapshotStore<SessionsSnapshot>({ byId: {} })
  ctx.provide('sessions', { list: sessionsStore } as never)
  const skillsList = vi.fn<() => Promise<RemoteResult<{ readonly skills: readonly unknown[] }>>>()
    .mockResolvedValue({ ok: true, value: { skills: [] } })
  ctx.provide('remote.skills', { list: skillsList })
  const inventoryList = vi.fn<() => Promise<RemoteResult<InventoryValue>>>()
    .mockResolvedValue({ ok: true, value: { entries: [], agentPresets: [] } })
  ctx.provide('remote.pluginInventory', { list: inventoryList })
  return { ctx, sessionsStore, slots: ctx.get('slots') as SlotRegistry, locale, skillsList, inventoryList }
}

function declare(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: { 'settings.plugins.tab': { kind: 'list', scope: 'root' } },
  } as never, () => null)
}

describe('ui-settings-skill-mcp browser plugin', () => {
  it('keeps the host Loader entry inert', () => {
    expect(hostApply).not.toThrow()
  })

  it('declares only the services used by the two Settings tab contributions', () => {
    expect(inject).toEqual(['slots', 'locale', 'remote', 'remote.skills', 'remote.pluginInventory', 'sessions'])
  })

  it('registers both localized tabs without reading any Remote eagerly', async () => {
    const b = await bench()
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()

    const entries = b.slots.entries('settings.plugins.tab')
    expect(entries).toHaveLength(2)
    expect(entries[0]!.component).toBe(SkillsSettingsTab)
    expect(entries[0]!.options).toMatchObject({ id: 'skills', order: 20 })
    expect(entries[0]!.locale).toBe(NS)
    expect(resolveSlotLabel(entries[0]!.options.label)).toBe(zh.skillsTab)
    expect(entries[1]!.component).toBe(McpSettingsTab)
    expect(entries[1]!.options).toMatchObject({ id: 'mcp', order: 30 })
    expect(resolveSlotLabel(entries[1]!.options.label)).toBe(zh.mcpTab)
    expect(b.skillsList).not.toHaveBeenCalled()
    expect(b.inventoryList).not.toHaveBeenCalled()

    b.locale.setLocale('en')
    expect(resolveSlotLabel(b.slots.entries('settings.plugins.tab')[0]!.options.label)).toBe(en.skillsTab)
    expect(resolveSlotLabel(b.slots.entries('settings.plugins.tab')[1]!.options.label)).toBe(en.mcpTab)
    await b.ctx.fiber.dispose()
  })

  it('derives the main-view session and wraps Remote failures', async () => {
    const b = await bench()
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()

    const tabEntries = b.slots.entries('settings.plugins.tab')
    // The registry type-erases inject faces to a record; narrow each member here.
    const skillsFace = tabEntries[0]!.inject!()
    const hooks = skillsFace['hooks'] as { readonly skillMainSession: ObservableSnapshot<SessionId | undefined> }
    const listSkills = skillsFace['listSkills'] as (sessionId: SessionId) => Promise<readonly unknown[]>
    const mcpFace = tabEntries[1]!.inject!()
    const listServers = mcpFace['listServers'] as () => Promise<readonly McpScope[]>

    expect(hooks.skillMainSession.getSnapshot()).toBeUndefined()
    b.sessionsStore.set({
      byId: {
        plain: { id: 'plain', retainedBy: {} },
        idle: { id: 'idle', retainedBy: { mainView: 0 } },
        shown: { id: 'shown', retainedBy: { mainView: 1 } },
      },
    })
    expect(hooks.skillMainSession.getSnapshot()).toBe('shown' as SessionId)
    const listener = vi.fn()
    const unsubscribe = hooks.skillMainSession.subscribe(listener)
    b.sessionsStore.set({ byId: { other: { id: 'other', retainedBy: { mainView: 2 } } } })
    expect(listener).toHaveBeenCalled()
    expect(hooks.skillMainSession.getSnapshot()).toBe('other' as SessionId)
    unsubscribe()
    b.sessionsStore.set({ byId: {} })
    expect(listener).toHaveBeenCalledOnce()

    await expect(listSkills('s1' as SessionId)).resolves.toEqual([])
    b.skillsList.mockResolvedValueOnce({ ok: false, error: { code: 'NO_SESSION', message: 'gone' } })
    await expect(listSkills('s1' as SessionId)).rejects.toThrow('skills/list failed: NO_SESSION: gone')

    await expect(listServers()).resolves.toEqual([])
    b.inventoryList.mockResolvedValueOnce({
      ok: true,
      value: {
        entries: [{ entryId: 'mcp-a', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: true, fiberPhase: 'active' }],
        agentPresets: [],
      },
    })
    await expect(listServers()).resolves.toEqual([
      {
        id: 'global',
        kind: 'global',
        rows: [{
          key: 'global:mcp-a',
          entryId: 'mcp-a',
          moduleName: '@deepseek-ai/dsh-mcp-client',
          enablement: 'enabled',
          phase: 'active',
        }],
      },
    ])
    b.inventoryList.mockResolvedValueOnce({ ok: false, error: { code: 'HOST_OFF', message: 'unavailable' } })
    await expect(listServers()).rejects.toThrow('pluginInventory/list failed: HOST_OFF: unavailable')

    // The shared projection title helper stays reachable through the face.
    expect(entryTitle({ key: 'k', entryId: null, moduleName: '@deepseek-ai/dsh-mcp-client', enablement: 'enabled', phase: null })).toBe('dsh-mcp-client')
    await b.ctx.fiber.dispose()
  })

  it('follows late declaration, declarer reload, and disposal', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries('settings.plugins.tab')).toHaveLength(0)

    const stop = declare(b.slots)
    await vi.waitFor(() => { expect(b.slots.entries('settings.plugins.tab')).toHaveLength(2) })
    b.locale.setLocale('en')
    expect(resolveSlotLabel(b.slots.entries('settings.plugins.tab')[0]!.options.label)).toBe(en.skillsTab)

    stop()
    expect(b.slots.entries('settings.plugins.tab')).toHaveLength(0)
    declare(b.slots)
    await vi.waitFor(() => {
      expect(b.slots.entries('settings.plugins.tab')[1]?.component).toBe(McpSettingsTab)
    })

    await fiber.dispose()
    expect(b.slots.entries('settings.plugins.tab')).toHaveLength(0)
    expect(() => b.locale.register(NS, 'zh', {})).not.toThrow()
    await b.ctx.fiber.dispose()
  })
})
