/**
 * Pomodoro Timer — Right-Sidebar tab type definition.
 *
 * Declares the `pomodoro` page type that appears in the guide and can be
 * opened via keyboard shortcut or explicit navigation.
 */
import type { ShortcutCommandId } from '@deepseek-ai/dsh-client-shortcuts/client'
import type { SidebarRightTabDefinition } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-locale/client'
import { IconClockOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'

/** The tab kind this package owns. */
export const POMODORO_KIND = 'pomodoro'

/** This implementation's identity in the tab system, and the key its body registers under. */
export const POMODORO_ID = '@deepseek-ai/dsh-client-ui-pomodoro'

/**
 * The pomodoro tab type's registry definition.
 * @param t - namespace-bound translate, read fresh on every label call.
 * @returns the definition to register.
 */
export function pomodoroDefinition(t: TranslateNS<'pomodoro'>): SidebarRightTabDefinition {
  return {
    id: POMODORO_ID,
    kind: POMODORO_KIND,
    priority: 'builtin',
    multiple: false, // Only one instance per pane
    title: () => t('guideTitle'),
    guide: [{
      id: 'pomodoro',
      commandId: 'pomodoro.timer' as ShortcutCommandId,
      order: 50,
      title: () => t('guideTitle'),
      description: () => t('guideDescription'),
      icon: IconClockOutlineRegular,
    }],
  }
}
