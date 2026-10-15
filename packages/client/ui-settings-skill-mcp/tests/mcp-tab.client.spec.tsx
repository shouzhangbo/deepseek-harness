// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { McpSettingsTab } from '../src/client/McpSettingsTab.tsx'
import type { McpSettingsTabProps } from '../src/client/McpSettingsTab.tsx'
import type { McpRow, McpScope } from '../src/client/mcp-view.ts'
import { en, type SkillMcpKey } from '../src/client/locales.ts'

afterEach(cleanup)

const t = ((key: SkillMcpKey, params?: Record<string, string>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    en[key],
  )) as McpSettingsTabProps['t']

const MCP = '@deepseek-ai/dsh-mcp-client'

function row(overrides: Partial<McpRow>): McpRow {
  return {
    key: overrides.entryId ?? 'row',
    entryId: 'mcp-x',
    moduleName: MCP,
    enablement: 'enabled',
    phase: null,
    ...overrides,
  } as McpRow
}

function props(listServers: () => Promise<readonly McpScope[]>): McpSettingsTabProps {
  return { t, listServers } as McpSettingsTabProps
}

describe('McpSettingsTab', () => {
  it('shows loading, then an empty notice when nothing is configured', async () => {
    const listServers = vi.fn(async () => [] as readonly McpScope[])
    render(<McpSettingsTab {...props(listServers)} />)
    expect(screen.getByRole('status').textContent).toBe(en.loading)
    expect(await screen.findByText(en.mcpEmpty)).toBeTruthy()
  })

  it('recovers from a failed read through retry', async () => {
    const listServers = vi.fn<() => Promise<readonly McpScope[]>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([{ id: 'global', kind: 'global', rows: [row({ entryId: 'late' })] }])
    render(<McpSettingsTab {...props(listServers)} />)
    expect((await screen.findByRole('alert')).textContent).toBe(en.error)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.retry })) })
    expect(await screen.findByText('late')).toBeTruthy()
    expect(listServers).toHaveBeenCalledTimes(2)
  })

  it('ignores a response that lands after unmount', async () => {
    let resolveScopes: ((scopes: readonly McpScope[]) => void) | undefined
    const listServers = vi.fn(() => new Promise<readonly McpScope[]>((r) => { resolveScopes = r }))
    const view = render(<McpSettingsTab {...props(listServers)} />)
    await vi.waitFor(() => { expect(listServers).toHaveBeenCalled() })
    view.unmount()
    await act(async () => { resolveScopes?.([]) })
    expect(listServers).toHaveBeenCalledOnce()
  })

  it('ignores a rejection that lands after unmount', async () => {
    let rejectScopes: ((reason: Error) => void) | undefined
    const listServers = vi.fn(() => new Promise<readonly McpScope[]>((_r, j) => { rejectScopes = j }))
    const view = render(<McpSettingsTab {...props(listServers)} />)
    await vi.waitFor(() => { expect(listServers).toHaveBeenCalled() })
    view.unmount()
    await act(async () => { rejectScopes?.(new Error('late')) })
    expect(listServers).toHaveBeenCalledOnce()
  })

  it('groups global and preset scopes under their own headings', async () => {
    const listServers = vi.fn(async () => [
      { id: 'global', kind: 'global', rows: [row({ entryId: 'mcp-global' })] },
      { id: 'ptc', kind: 'preset', presetName: 'PTC', rows: [row({ entryId: 'mcp-preset' })] },
    ] as readonly McpScope[])
    render(<McpSettingsTab {...props(listServers)} />)
    expect(await screen.findByText('mcp-global')).toBeTruthy()
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map(node => node.textContent)).toEqual([en.mcpScopeGlobal, 'PTC'])
    expect(document.querySelector('[data-mcp-scope="global"]')).toBeTruthy()
    expect(document.querySelector('[data-mcp-scope="preset"]')).toBeTruthy()
  })

  it('renders enablement tags, conditions, and the failure flag', async () => {
    const listServers = vi.fn(async () => [
      {
        id: 'global',
        kind: 'global',
        rows: [
          row({ entryId: 'plain' }),
          row({ key: 'g-d', entryId: 'off', enablement: 'disabled' }),
          row({
            key: 'g-c',
            entryId: 'gate',
            enablement: 'conditional',
            condition: "process.platform === 'win32'",
          }),
          row({ key: 'g-f', entryId: 'crashy', enablement: 'failed', phase: 'failed' }),
        ],
      },
    ] as readonly McpScope[])
    render(<McpSettingsTab {...props(listServers)} />)
    expect(await screen.findByText('plain')).toBeTruthy()
    expect(screen.getByText(en.mcpDisabled)).toBeTruthy()
    expect(screen.getByText(en.mcpConditional)).toBeTruthy()
    expect(screen.getByText(en.mcpFailed)).toBeTruthy()
    expect(screen.getByText(en.mcpCondition)).toBeTruthy()
    expect(screen.getByText("process.platform === 'win32'")).toBeTruthy()
    expect(document.querySelector('[data-failed="true"]')).toBeTruthy()
    // An enabled, settled row carries no tag and no runtime line.
    const plainDetails = screen.getByText('plain').closest('li')!.querySelectorAll('dt')
    expect(plainDetails).toHaveLength(1)
    expect(plainDetails[0]?.textContent).toBe(en.mcpModule)
  })

  it('shows phase dots only for pending, loading, and unloading', async () => {
    const listServers = vi.fn(async () => [
      {
        id: 'global',
        kind: 'global',
        rows: [
          row({ key: 'g-1', entryId: 'queued', phase: 'pending' }),
          row({ key: 'g-2', entryId: 'booting', phase: 'loading' }),
          row({ key: 'g-3', entryId: 'draining', phase: 'unloading' }),
          row({ key: 'g-4', entryId: 'running', phase: 'active' }),
        ],
      },
    ] as readonly McpScope[])
    render(<McpSettingsTab {...props(listServers)} />)
    await screen.findByText('queued')
    expect(screen.getByRole('img', { name: en.pending })).toBeTruthy()
    expect(screen.getByRole('img', { name: en.loadingPhase })).toBeTruthy()
    expect(screen.getByRole('img', { name: en.unloading })).toBeTruthy()
    expect(screen.queryByRole('img', { name: en.active })).toBeNull()
    // Every row with a live phase gains a runtime line; the settled active row keeps one too.
    expect(screen.getAllByText(en.mcpRuntime)).toHaveLength(4)
    expect(screen.getByText(en.active)).toBeTruthy()
  })

  it('titles an anonymous row with the scope-stripped module name', async () => {
    const listServers = vi.fn(async () => [
      { id: 'global', kind: 'global', rows: [row({ entryId: null })] },
    ] as readonly McpScope[])
    render(<McpSettingsTab {...props(listServers)} />)
    expect(await screen.findByText('dsh-mcp-client')).toBeTruthy()
  })
})
