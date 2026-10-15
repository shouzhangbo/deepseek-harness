import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SkillEntry } from '@deepseek-ai/dsh-api-remotes/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { IconSearchOutlineRegular, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './SkillMcpTabs.module.css'

/** Registration-side Remote face used by the Skills tab. */
export interface SkillsSettingsTabInjected {
  hooks: {
    /** Session currently retained by the main view; undefined while none is shown. */
    skillMainSession: ObservableSnapshot<SessionId | undefined>
  }
  /** Read one Session's user-invocable skill catalog without loading bodies. */
  listSkills: (sessionId: SessionId) => Promise<readonly SkillEntry[]>
}

/** Full component props assembled by the Settings slot renderer. */
export type SkillsSettingsTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'settings.skillMcp'>
  & InjectFace<SkillsSettingsTabInjected>

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly skills: readonly SkillEntry[] }

/** Match a row by the query against its name and description. */
function matches(skill: SkillEntry, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) return true
  return [skill.name, skill.description]
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

/** Render the main-view Session's user-invocable skills, read-only. */
export function SkillsSettingsTab(
  { listSkills, t, useSkillMainSession }: SkillsSettingsTabProps,
): ReactNode {
  const sessionId = useSkillMainSession(snapshot => snapshot)
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    if (sessionId === undefined) return undefined
    let current = true
    void Promise.resolve().then(() => listSkills(sessionId)).then(
      (skills) => { if (current) setState({ status: 'ready', skills }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [listSkills, sessionId, request])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const skills = state.status === 'ready' ? state.skills : []
  const sorted = useMemo(
    () => [...skills].sort((a, b) => a.name.localeCompare(b.name)),
    [skills],
  )
  const filtered = sorted.filter(skill => matches(skill, normalizedQuery))

  if (sessionId === undefined) {
    return (
      <div className={css.section}>
        <p className={css.status} role="status">{t('skillsEmptySession')}</p>
      </div>
    )
  }
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
      <label className={css.search}>
        <IconSearchOutlineRegular aria-hidden="true" />
        <span className={css.visuallyHidden}>{t('skillsSearch')}</span>
        <input
          type="search"
          value={query}
          placeholder={t('skillsSearch')}
          aria-label={t('skillsSearch')}
          onChange={(event) => { setQuery(event.currentTarget.value) }}
        />
      </label>
      {sorted.length === 0 ? <p className={css.status}>{t('skillsEmpty')}</p> : null}
      {sorted.length > 0 && filtered.length === 0 ? <p className={css.status}>{t('skillsEmptySearch')}</p> : null}
      {filtered.length > 0 ? (
        <ul className={css.list}>
          {filtered.map(skill => (
            <li key={skill.name} className={css.row}>
              <span className={css.rowMainRow}>
                <strong className={css.rowTitle} title={skill.path}>{skill.name}</strong>
                {skill.modelInvocable ? null : <Tag tone="neutral">{t('skillsScopeUser')}</Tag>}
              </span>
              <span className={css.rowDescription}>{skill.description}</span>
              {skill.whenToUse === undefined && skill.path === undefined ? null : (
                <dl className={css.details}>
                  {skill.whenToUse === undefined ? null : (
                    <div>
                      <dt>{t('skillsWhenToUse')}</dt>
                      <dd>{skill.whenToUse}</dd>
                    </div>
                  )}
                  {skill.path === undefined ? null : (
                    <div>
                      <dt>{t('skillsPath')}</dt>
                      <dd><code className={css.code}>{skill.path}</code></dd>
                    </div>
                  )}
                </dl>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
