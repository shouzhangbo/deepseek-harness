import { useEffect, useState, type ReactNode } from 'react'
import { StateDot, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { StateDotState, TagTone } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { entryTitle } from './mcp-view.ts'
import type { McpEnablement, McpFiberPhase, McpRow, McpScope } from './mcp-view.ts'
import type { SkillMcpKey } from './locales.ts'
import css from './SkillMcpTabs.module.css'

/** Registration-side face used by the MCP servers tab. */
export interface McpSettingsTabInjected {
  /** Read the Host inventory projected to MCP-server scopes. */
  listServers: () => Promise<readonly McpScope[]>
}

/** Full component props assembled by the Settings slot renderer. */
export type McpSettingsTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'settings.skillMcp'>
  & InjectFace<McpSettingsTabInjected>

type Translate = McpSettingsTabProps['t']

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly scopes: readonly McpScope[] }

const PHASE_KEYS = {
  pending: 'pending',
  loading: 'loadingPhase',
  active: 'active',
  failed: 'failed',
  unloading: 'unloading',
} as const satisfies Record<Exclude<McpFiberPhase, null>, SkillMcpKey>

/* Mirrors the Plugin list tab: `pending` is the only dotted phase with no work
   under way; `loading` and `unloading` animate; `active` and `failed` show no
   dot — a settled row needs no marker, and a failed row has the failure tag. */
const PHASE_DOT_STATES = {
  pending: 'idle',
  loading: 'ongoing',
  unloading: 'ongoing',
} as const satisfies Partial<Record<NonNullable<McpFiberPhase>, StateDotState>>

type DotPhase = keyof typeof PHASE_DOT_STATES

const ENABLEMENT_KEYS = {
  disabled: 'mcpDisabled',
  conditional: 'mcpConditional',
  failed: 'mcpFailed',
} as const satisfies Record<Exclude<McpEnablement, 'enabled'>, SkillMcpKey>

const TAG_TONES = {
  disabled: 'neutral',
  conditional: 'warning',
  failed: 'danger',
} as const satisfies Record<Exclude<McpEnablement, 'enabled'>, TagTone>

/** Whether a live root-fiber phase carries a dot of its own. */
function showsPhaseDot(phase: McpFiberPhase): phase is DotPhase {
  return phase === 'pending' || phase === 'loading' || phase === 'unloading'
}

/** Status dot naming a live root-fiber phase; rows without a dotted phase show none. */
function PhaseDot({ phase, t }: { readonly phase: DotPhase; readonly t: Translate }): ReactNode {
  const status = t(PHASE_KEYS[phase])
  /* StateDot is aria-hidden, so the phase name lives on this wrapper. */
  return (
    <span className={css.phaseDot} role="img" aria-label={status} title={status}>
      <StateDot state={PHASE_DOT_STATES[phase]} />
    </span>
  )
}

/** One projected MCP server: identity, enablement tag, phase dot, and detail facts. */
function McpServerRowCard({ row, t }: { readonly row: McpRow; readonly t: Translate }): ReactNode {
  return (
    <li className={css.row} data-failed={row.enablement === 'failed' ? 'true' : undefined}>
      <span className={css.rowMainRow}>
        <strong className={css.rowTitle} title={row.moduleName}>{entryTitle(row)}</strong>
        <span className={css.rowTrailing}>
          {showsPhaseDot(row.phase) ? <PhaseDot phase={row.phase} t={t} /> : null}
          {row.enablement === 'enabled' ? null : (
            <Tag tone={TAG_TONES[row.enablement]}>{t(ENABLEMENT_KEYS[row.enablement])}</Tag>
          )}
        </span>
      </span>
      <dl className={css.details}>
        <div>
          <dt>{t('mcpModule')}</dt>
          <dd><code className={css.code}>{row.moduleName}</code></dd>
        </div>
        {row.phase === null ? null : (
          <div>
            <dt>{t('mcpRuntime')}</dt>
            <dd>{t(PHASE_KEYS[row.phase])}</dd>
          </div>
        )}
        {row.condition === undefined ? null : (
          <div>
            <dt>{t('mcpCondition')}</dt>
            <dd><code className={css.code}>{row.condition}</code></dd>
          </div>
        )}
      </dl>
    </li>
  )
}

/** Render the loaded MCP servers, read-only, in global and per-preset scopes. */
export function McpSettingsTab({ listServers, t }: McpSettingsTabProps): ReactNode {
  const [request, setRequest] = useState(0)
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    let current = true
    void Promise.resolve().then(() => listServers()).then(
      (scopes) => { if (current) setState({ status: 'ready', scopes }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [listServers, request])

  if (state.status === 'loading') {
    return (
      <div className={css.section} aria-busy="true">
        <p className={css.status} role="status">{t('loading')}</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className={css.section}>
        <div className={css.failure}>
          <p role="alert">{t('error')}</p>
          <button
            type="button"
            onClick={() => {
              setState({ status: 'loading' })
              setRequest(value => value + 1)
            }}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className={css.section}>
      {state.scopes.length === 0 ? <p className={css.status}>{t('mcpEmpty')}</p> : null}
      {state.scopes.map(scope => (
        <section key={scope.id} className={css.group} data-mcp-scope={scope.kind}>
          <h3 className={css.groupTitle}>
            {scope.kind === 'global' ? t('mcpScopeGlobal') : scope.presetName}
          </h3>
          <ul className={css.list}>
            {scope.rows.map(row => <McpServerRowCard key={row.key} row={row} t={t} />)}
          </ul>
        </section>
      ))}
    </div>
  )
}
