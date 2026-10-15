/**
 * Browser half: register `pomodoro` as a right-Sidebar tab type.
 *
 * The public two-stage path: the type into `ctx.sidebarRightTabs`, the body
 * into the keyed `sidebar.right.pane.tab` seat under the type's `id`. The chip
 * title needs no seat — the registry captures `definition.title()` at open
 * time and the tab shows it unchanged.
 */
import type { ShortcutCommandId } from '@deepseek-ai/dsh-client-shortcuts/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { POMODORO_ID, POMODORO_KIND, pomodoroDefinition } from './pomodoro-definition.tsx'
import { PomodoroPanel } from './PomodoroPanel.tsx'
import { en, zh, type PomodoroKey } from './locales.ts'

export type { PomodoroKey } from './locales.ts'
export type { PomodoroPhase, PomodoroState } from './types.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Pomodoro timer copy: phase names, controls, and hints. */
    pomodoro: PomodoroKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'pomodoro'

/** Services needed by the tab type: the registry, the keyed seat, shortcuts, and copy. */
export const inject = ['slots', 'locale', 'shortcuts', 'sidebarRight', 'sidebarRightTabs']

/**
 * Client plugin body: register the shortcut, the type, its dictionaries, and its body.
 * @param ctx - client root context carrying the registry, the slots, and locale.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)

  ctx.effect(() => ctx.shortcuts.register({
    id: 'pomodoro.timer' as ShortcutCommandId,
    label: () => t('guideTitle'),
    aliases: ['pomodoro', 'timer', 'focus timer'],
    defaults: {
      'desktop:macos': { code: 'KeyT', modifiers: ['primary', 'shift'] },
      'web:macos': { code: 'KeyT', modifiers: ['primary', 'alt', 'shift'] },
    },
    regions: ['page', 'editable'],
    modals: [],
    resolve: ({ target: element }) => {
      const target = ctx.sidebarRight.commandTarget(element)
      if (target === undefined) return { status: 'blocked', reason: t('noSession') }
      return { status: 'handled', run: () => { ctx.sidebarRight.openTab(POMODORO_KIND) } }
    },
  }), 'ui-pomodoro: shortcut')

  ctx.effect(() => ctx.sidebarRightTabs.register(pomodoroDefinition(t)), 'ui-pomodoro: pomodoro type')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-pomodoro: dictionaries')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab', key: POMODORO_ID, locale: NS },
    PomodoroPanel,
  )), 'ui-pomodoro: pomodoro tab body')
}
