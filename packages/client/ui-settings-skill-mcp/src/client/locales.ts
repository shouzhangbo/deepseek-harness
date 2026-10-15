/** Copy dictionaries for the Skills and MCP servers Settings tabs. */

/** Simplified Chinese dictionary and key source of truth. */
export const zh = {
  skillsTab: '技能',
  mcpTab: 'MCP 服务',
  loading: '正在读取…',
  error: '暂时无法读取。',
  retry: '重试',

  skillsEmptySession: '打开一个会话后即可在此查看它可用的技能。',
  skillsEmpty: '该会话暂无可用技能。',
  skillsSearch: '搜索技能',
  skillsEmptySearch: '没有匹配的技能。',
  skillsScopeUser: '仅用户',
  skillsPath: '技能文件',
  skillsWhenToUse: '使用时机',

  mcpEmpty: '当前没有已配置的 MCP 服务。',
  mcpScopeGlobal: '全局 MCP 服务',
  mcpDisabled: '已停用',
  mcpConditional: '条件启用',
  mcpFailed: '启动失败',
  mcpCondition: '禁用条件',
  mcpModule: '完整名称',
  mcpRuntime: '运行状态',
  pending: '等待依赖',
  loadingPhase: '加载中',
  active: '运行中',
  failed: '启动失败',
  unloading: '卸载中',
} satisfies Record<string, string>

/** Skills and MCP Settings locale key union. */
export type SkillMcpKey = keyof typeof zh

/** English dictionary checked against the Chinese key set. */
export const en = {
  skillsTab: 'Skills',
  mcpTab: 'MCP servers',
  loading: 'Reading…',
  error: 'Temporarily unavailable.',
  retry: 'Retry',

  skillsEmptySession: 'Open a session to see the skills available to it.',
  skillsEmpty: 'No skills are available for this session.',
  skillsSearch: 'Search skills',
  skillsEmptySearch: 'No matching skills.',
  skillsScopeUser: 'User only',
  skillsPath: 'Skill file',
  skillsWhenToUse: 'When to use',

  mcpEmpty: 'No MCP servers are configured.',
  mcpScopeGlobal: 'Global MCP servers',
  mcpDisabled: 'Disabled',
  mcpConditional: 'Conditional',
  mcpFailed: 'Failed',
  mcpCondition: 'Disabled when',
  mcpModule: 'Module',
  mcpRuntime: 'Status',
  pending: 'Waiting for dependencies',
  loadingPhase: 'Loading',
  active: 'Running',
  failed: 'Failed to start',
  unloading: 'Unloading',
} satisfies Record<SkillMcpKey, string>
