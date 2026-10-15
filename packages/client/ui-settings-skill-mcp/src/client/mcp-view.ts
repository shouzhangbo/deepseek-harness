/** Pure projection of the Host plugin inventory into MCP-server settings rows. */

import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'

/** Loader module specifier every MCP server instance shares. */
const MCP_MODULE_NAME = '@deepseek-ai/dsh-mcp-client'

/** Root-fiber phase of one inventory row, read from the shared Remote schema. */
export type McpFiberPhase = PluginInventorySnapshot['entries'][number]['fiberPhase']

/** Enablement state a settings row reports, folded from enablement plus phase. */
export type McpEnablement = 'enabled' | 'disabled' | 'conditional' | 'failed'

/** One MCP server as shown in Settings: its identity, enablement, phase, and gate. */
export interface McpRow {
  /** Stable React key, qualified by the owning scope. */
  readonly key: string
  /** Loader entry id, or null when the composition row declares none. */
  readonly entryId: string | null
  /** Exact module specifier; identical across rows, kept for the details view. */
  readonly moduleName: string
  readonly enablement: McpEnablement
  readonly phase: McpFiberPhase
  /** The row's own `!!js` disable expression, when it carries one. */
  readonly condition?: string
}

/** One display group: all global MCP servers, or one agent preset's servers. */
export interface McpScope {
  readonly id: string
  readonly kind: 'global' | 'preset'
  /** Preset display name for a preset scope; unused for the global scope. */
  readonly presetName?: string
  readonly rows: readonly McpRow[]
}

type InventoryEntry = PluginInventorySnapshot['entries'][number]
type PresetRow = NonNullable<PluginInventorySnapshot['agentPresets']>[number]['rows'][number]

/** Enablement folded from a global entry's Loader enablement and phase. */
function entryEnablement(entry: InventoryEntry): McpEnablement {
  if (entry.fiberPhase === 'failed') return 'failed'
  return entry.enabled ? 'enabled' : 'disabled'
}

/** Enablement folded from a preset row, keeping the `'conditional'` state. */
function rowEnablement(row: PresetRow): McpEnablement {
  if (row.fiberPhase === 'failed') return 'failed'
  if (row.enabled === true) return 'enabled'
  if (row.enabled === false) return 'disabled'
  return 'conditional'
}

/**
 * Display title: the configured entry id, or a scope-qualified fallback.
 * @param row - one projected MCP row.
 * @returns the entry id when present, otherwise the module name without its npm scope.
 */
function entryTitle(row: McpRow): string {
  return row.entryId ?? row.moduleName.replace(/^@[^/]+\//, '')
}

export { entryTitle }

/**
 * Project a Host inventory snapshot into the MCP-server scopes Settings shows.
 * @param snapshot - the raw plugin inventory from the Host.
 * @returns one global scope plus one scope per preset that provides MCP servers, in snapshot order.
 */
export function projectMcpServers(snapshot: PluginInventorySnapshot): readonly McpScope[] {
  const scopes: McpScope[] = []

  const globalRows = snapshot.entries
    .filter(entry => entry.moduleName === MCP_MODULE_NAME)
    .map(entry => ({
      key: `global:${String(entry.entryId)}`,
      entryId: entry.entryId,
      moduleName: entry.moduleName,
      enablement: entryEnablement(entry),
      phase: entry.fiberPhase,
    } satisfies McpRow))
  if (globalRows.length > 0) scopes.push({ id: 'global', kind: 'global', rows: globalRows })

  for (const preset of snapshot.agentPresets ?? []) {
    if (preset.broken !== undefined) continue
    const rows = preset.rows
      .filter(row => row.moduleName === MCP_MODULE_NAME)
      .map((row, index) => ({
        key: `preset:${preset.id}:${String(index)}`,
        entryId: row.entryId,
        moduleName: row.moduleName,
        enablement: rowEnablement(row),
        phase: row.fiberPhase,
        ...row.condition === undefined ? {} : { condition: row.condition },
      } satisfies McpRow))
    if (rows.length === 0) continue
    scopes.push({ id: preset.id, kind: 'preset', presetName: preset.name ?? preset.id, rows })
  }

  return scopes
}
