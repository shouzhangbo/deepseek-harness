// @vitest-environment jsdom
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SkillEntry } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SkillsSettingsTab } from '../src/client/SkillsSettingsTab.tsx'
import type { SkillsSettingsTabProps } from '../src/client/SkillsSettingsTab.tsx'
import { en, type SkillMcpKey } from '../src/client/locales.ts'

afterEach(cleanup)

const t = ((key: SkillMcpKey, params?: Record<string, string>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    en[key],
  )) as SkillsSettingsTabProps['t']

const SESSION = 'session-1' as SessionId

function skill(overrides: Partial<SkillEntry>): SkillEntry {
  return { name: 'alpha', description: 'First skill', modelInvocable: true, ...overrides } as SkillEntry
}

function props(
  listSkills: (sessionId: SessionId) => Promise<readonly SkillEntry[]>,
  // null keeps the "no main-view Session" case away from the default parameter.
  sessionId: SessionId | undefined | null = SESSION,
): { pageProps: SkillsSettingsTabProps; store: ReturnType<typeof createSnapshotStore<SessionId | undefined>> } {
  const store = createSnapshotStore<SessionId | undefined>(sessionId === null ? undefined : sessionId)
  return {
    store,
    pageProps: {
      t,
      listSkills,
      useSkillMainSession: bindSnapshotSelector(store),
    } as SkillsSettingsTabProps,
  }
}

describe('SkillsSettingsTab', () => {
  it('points at the main view instead of reading a Remote without a Session', async () => {
    const listSkills = vi.fn()
    const { pageProps } = props(async () => [], null)
    render(<SkillsSettingsTab {...pageProps} />)
    expect(await screen.findByText(en.skillsEmptySession)).toBeTruthy()
    expect(listSkills).not.toHaveBeenCalled()
  })

  it('loads once a Session appears in the main view', async () => {
    const listSkills = vi.fn(async () => [skill({})])
    const { pageProps, store } = props(listSkills, null)
    render(<SkillsSettingsTab {...pageProps} />)
    expect(screen.getByText(en.skillsEmptySession)).toBeTruthy()
    act(() => { store.set(SESSION) })
    expect(await screen.findByText('alpha')).toBeTruthy()
    expect(listSkills).toHaveBeenCalledWith(SESSION)
  })

  it('shows loading, then sorts rows and hides details for bare skills', async () => {
    let resolveList: ((skills: readonly SkillEntry[]) => void) | undefined
    const listSkills = vi.fn(() => new Promise<readonly SkillEntry[]>((r) => { resolveList = r }))
    const { pageProps } = props(listSkills)
    render(<SkillsSettingsTab {...pageProps} />)
    expect(screen.getByRole('status').textContent).toBe(en.loading)
    // The effect defers its fetch by one microtask; let it reach the Remote first.
    await vi.waitFor(() => { expect(listSkills).toHaveBeenCalled() })
    await act(async () => { resolveList?.([skill({ name: 'beta', description: 'Second' }), skill({ name: 'alpha' })]) })
    const titles = screen.getAllByRole('listitem')
    expect(titles.map(node => node.querySelector('strong')?.textContent)).toEqual(['alpha', 'beta'])
    expect(document.querySelectorAll('dl')).toHaveLength(0)
    expect(screen.getByText('First skill')).toBeTruthy()
  })

  it('renders user-only tags and whenToUse/path details', async () => {
    const listSkills = vi.fn(async () => [
      skill({ name: 'solo', modelInvocable: false, whenToUse: 'When auditing' }),
      skill({ name: 'pathed', path: '/skills/pathed/SKILL.md' }),
    ])
    const { pageProps } = props(listSkills)
    render(<SkillsSettingsTab {...pageProps} />)
    expect(await screen.findByText('User only')).toBeTruthy()
    expect(screen.getByText('When auditing')).toBeTruthy()
    expect(screen.getByText(en.skillsWhenToUse)).toBeTruthy()
    expect(screen.getByText(en.skillsPath)).toBeTruthy()
    expect(screen.getByText('/skills/pathed/SKILL.md')).toBeTruthy()
  })

  it('filters by name or description and reports no matches', async () => {
    const listSkills = vi.fn(async () => [
      skill({ name: 'alpha', description: 'About trees' }),
      skill({ name: 'beta', description: 'About rivers', whenToUse: 'Water work', path: '/b' }),
    ])
    const { pageProps } = props(listSkills)
    render(<SkillsSettingsTab {...pageProps} />)
    await screen.findByText('alpha')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'RIVERS' } })
    expect(screen.queryByText('alpha')).toBeNull()
    expect(screen.getByText('beta')).toBeTruthy()
    expect(screen.getByText('Water work')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing' } })
    expect(screen.getByText(en.skillsEmptySearch)).toBeTruthy()
  })

  it('reports an empty catalog', async () => {
    const { pageProps } = props(async () => [])
    render(<SkillsSettingsTab {...pageProps} />)
    expect(await screen.findByText(en.skillsEmpty)).toBeTruthy()
  })

  it('ignores a response that lands after unmount', async () => {
    let resolveList: ((skills: readonly SkillEntry[]) => void) | undefined
    const listSkills = vi.fn(() => new Promise<readonly SkillEntry[]>((r) => { resolveList = r }))
    const { pageProps } = props(listSkills)
    const view = render(<SkillsSettingsTab {...pageProps} />)
    await vi.waitFor(() => { expect(listSkills).toHaveBeenCalled() })
    view.unmount()
    await act(async () => { resolveList?.([]) })
    expect(listSkills).toHaveBeenCalledOnce()
  })

  it('ignores a rejection that lands after unmount', async () => {
    let rejectList: ((reason: Error) => void) | undefined
    const listSkills = vi.fn(() => new Promise<readonly SkillEntry[]>((_r, j) => { rejectList = j }))
    const { pageProps } = props(listSkills)
    const view = render(<SkillsSettingsTab {...pageProps} />)
    await vi.waitFor(() => { expect(listSkills).toHaveBeenCalled() })
    view.unmount()
    await act(async () => { rejectList?.(new Error('late')) })
    expect(listSkills).toHaveBeenCalledOnce()
  })

  it('recovers from a failed read through retry', async () => {
    const listSkills = vi.fn<() => Promise<readonly SkillEntry[]>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([skill({ name: 'late' })])
    const { pageProps } = props(listSkills)
    render(<SkillsSettingsTab {...pageProps} />)
    expect((await screen.findByRole('alert')).textContent).toBe(en.error)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.retry })) })
    expect(await screen.findByText('late')).toBeTruthy()
    expect(listSkills).toHaveBeenCalledTimes(2)
  })
})
