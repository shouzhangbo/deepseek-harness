import { describe, expect, it } from 'vitest'
import { entryTitle, projectMcpServers } from '../src/client/mcp-view.ts'
import type { McpRow } from '../src/client/mcp-view.ts'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'

const MCP = '@deepseek-ai/dsh-mcp-client'

type Entry = PluginInventorySnapshot['entries'][number]
type PresetRow = NonNullable<PluginInventorySnapshot['agentPresets']>[number]['rows'][number]

function entry(overrides: Partial<Record<string, unknown>> = {}): Entry {
  return { entryId: 'mcp-x', moduleName: MCP, enabled: true, fiberPhase: 'active', ...overrides } as Entry
}

function presetRow(overrides: Partial<Record<string, unknown>> = {}): PresetRow {
  return { entryId: 'mcp-p', moduleName: MCP, enabled: true, fiberPhase: null, ...overrides } as PresetRow
}

describe('projectMcpServers', () => {
  it('returns no scopes when no row names the MCP module', () => {
    const scopes = projectMcpServers({
      entries: [entry({ moduleName: '@deepseek-ai/dsh-tool-bash' })],
      agentPresets: [{ id: 'standard', isDefault: true, rows: [presetRow({ moduleName: '@fixture/other' })] }],
    } as PluginInventorySnapshot)
    expect(scopes).toEqual([])
  })

  it('projects the global scope and folds failed phase into the failed state', () => {
    const scopes = projectMcpServers({
      entries: [
        entry({ entryId: 'mcp-a', fiberPhase: 'failed' }),
        entry({ entryId: 'mcp-b', enabled: false, fiberPhase: null }),
        entry({ entryId: 'mcp-c' }),
      ],
    } as PluginInventorySnapshot)
    expect(scopes).toHaveLength(1)
    const scope = scopes[0]!
    expect(scope.kind).toBe('global')
    expect(scope.rows.map(row => row.enablement)).toEqual(['failed', 'disabled', 'enabled'])
    expect(scope.rows[0]!.phase).toBe('failed')
  })

  it('projects preset scopes, keeps conditions, skips empty and broken groups', () => {
    const scopes = projectMcpServers({
      entries: [],
      agentPresets: [
        {
          id: 'standard',
          name: '标准模式',
          isDefault: true,
          rows: [
            presetRow({ enabled: 'conditional', condition: 'process.platform === \'win32\'', fiberPhase: 'pending' }),
            presetRow({ enabled: false }),
            presetRow({ enabled: true, fiberPhase: 'failed' }),
            presetRow({ moduleName: '@fixture/other' }),
          ],
        },
        { id: 'empty', isDefault: false, rows: [presetRow({ moduleName: '@fixture/other' })] },
        { id: 'broken', isDefault: false, broken: 'boom', rows: [presetRow()] },
      ],
    } as PluginInventorySnapshot)
    expect(scopes.map(scope => scope.presetName)).toEqual(['标准模式'])
    const rows = scopes[0]!.rows
    expect(rows.map(row => row.enablement)).toEqual(['conditional', 'disabled', 'failed'])
    expect(rows[0]!.condition).toBe('process.platform === \'win32\'')
    expect(rows[0]!.phase).toBe('pending')
    expect(rows[1]!.condition).toBeUndefined()
  })

  it('falls back to a scope-stripped module name when a preset row declares no entry id', () => {
    const scopes = projectMcpServers({
      entries: [],
      agentPresets: [{ id: 'mine', isDefault: false, rows: [presetRow({ entryId: null })] }],
    } as PluginInventorySnapshot)
    expect(scopes[0]!.presetName).toBe('mine')
    const row: McpRow = scopes[0]!.rows[0]!
    expect(row.key).toBe('preset:mine:0')
    expect(entryTitle(row)).toBe('dsh-mcp-client')
  })

  it('titles rows that carry an entry id with that id', () => {
    const scopes = projectMcpServers({ entries: [entry({ entryId: 'mcp-chrome-devtools' })] } as PluginInventorySnapshot)
    expect(entryTitle(scopes[0]!.rows[0]!)).toBe('mcp-chrome-devtools')
  })
})
