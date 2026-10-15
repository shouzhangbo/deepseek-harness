/** Read-only Skills and MCP servers tabs registered into the Settings Plugins section. */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
// Type-only: the typed ctx.remote face, including the `skills` and
// `pluginInventory` namespaces and their payload vocabulary.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only: the settings shell's SlotMap merge (the 'settings.plugins.tab' entry).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the Context merge that exposes `ctx.sessions`.
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { McpSettingsTab, type McpSettingsTabInjected } from './McpSettingsTab.tsx'
import { SkillsSettingsTab, type SkillsSettingsTabInjected } from './SkillsSettingsTab.tsx'
import { projectMcpServers } from './mcp-view.ts'
import { en, zh, type SkillMcpKey } from './locales.ts'

export type { McpSettingsTabInjected, McpSettingsTabProps } from './McpSettingsTab.tsx'
export type { SkillsSettingsTabInjected, SkillsSettingsTabProps } from './SkillsSettingsTab.tsx'
export type { SkillMcpKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Skills and MCP servers Settings tabs copy. */
    'settings.skillMcp': SkillMcpKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.skillMcp'

/** Services required by the two Settings tab registrations. */
export const inject = ['slots', 'locale', 'remote', 'remote.skills', 'remote.pluginInventory', 'sessions']

/**
 * Mount the Skills and MCP servers tabs. The Skills catalog is addressed by the
 * Session the main view retains; the MCP view projects the Host plugin inventory.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-skill-mcp: dictionaries')

  const t = ctx.locale.bind(NS)

  // The main view keeps exactly one Session retained; its id is a primitive,
  // so repeated reads stay snapshot-stable between list churn.
  const skillMainSession: ObservableSnapshot<SessionId | undefined> = {
    getSnapshot: () => Object.values(ctx.sessions.list.getSnapshot().byId)
      .find(session => (session.retainedBy.mainView ?? 0) > 0)?.id,
    subscribe: listener => ctx.sessions.list.subscribe(listener),
  }

  const listSkills: SkillsSettingsTabInjected['listSkills'] = async (sessionId) => {
    const result = await ctx.remote.skills.list({ sessionId })
    if (!result.ok) {
      throw new Error(`skills/list failed: ${result.error.code}: ${result.error.message}`)
    }
    return result.value.skills
  }

  const listServers: McpSettingsTabInjected['listServers'] = async () => {
    const result = await ctx.remote.pluginInventory.list()
    if (!result.ok) {
      throw new Error(`pluginInventory/list failed: ${result.error.code}: ${result.error.message}`)
    }
    return projectMcpServers(result.value)
  }

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'skills',
    order: 20,
    label: () => t('skillsTab'),
    locale: NS,
    inject: (): SkillsSettingsTabInjected => ({ listSkills, hooks: { skillMainSession } }),
  }, SkillsSettingsTab))

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'mcp',
    order: 30,
    label: () => t('mcpTab'),
    locale: NS,
    inject: (): McpSettingsTabInjected => ({ listServers }),
  }, McpSettingsTab))
}
