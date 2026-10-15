/**
 * Pomodoro Timer — localization dictionaries for the right-Sidebar panel.
 *
 * The `pomodoro` namespace is declared on `LocaleNamespaceMap` by the client
 * entry that registers these dictionaries, so `TranslateNS<'pomodoro'>` and
 * `PropsLocale<'pomodoro'>` resolve the keys below.
 */

/** Simplified Chinese dictionary — source of truth for the key set. */
export const zh = {
  'phase.work': '🍅 专注时间',
  'phase.shortBreak': '☕ 短休息',
  'phase.longBreak': '🌿 长休息',
  start: '开始',
  pause: '暂停',
  resume: '继续',
  reset: '重置',
  skip: '跳过',
  running: '进行中',
  workLabel: '工作:',
  shortBreakLabel: '短休息:',
  longBreakLabel: '长休息:',
  minutesUnit: '分钟',
  nextLongBreakHint: '下次长休息:',
  sessionsLeft: '个番茄钟后',
  noSession: '没有打开的会话，无法显示番茄钟',
  guideTitle: '番茄钟',
  guideDescription: '使用番茄工作法保持专注',
} satisfies Record<string, string>

/** English dictionary, checked against the Chinese key set at compile time. */
export const en = {
  'phase.work': '🍅 Focus Time',
  'phase.shortBreak': '☕ Short Break',
  'phase.longBreak': '🌿 Long Break',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  reset: 'Reset',
  skip: 'Skip',
  running: 'Running',
  workLabel: 'Work:',
  shortBreakLabel: 'Short break:',
  longBreakLabel: 'Long break:',
  minutesUnit: 'min',
  nextLongBreakHint: 'Next long break:',
  sessionsLeft: 'sessions away',
  noSession: 'No session is open, so the timer cannot show.',
  guideTitle: 'Pomodoro Timer',
  guideDescription: 'Use the Pomodoro Technique to stay focused',
} satisfies Record<keyof typeof zh, string>

/** Union of all localized key strings. */
export type PomodoroKey = keyof typeof zh
