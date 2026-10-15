/**
 * Pomodoro Timer — React component for DSH right Sidebar.
 *
 * Renders a focus timer with work/break phases, session counting, and a
 * skip/reset control row. Durations follow the classic Pomodoro technique:
 * 25 minutes of work, 5-minute short breaks, and a 15-minute long break
 * every fourth session.
 */
import { useEffect, useState, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { PomodoroPhase, PomodoroState } from './types.ts'
import styles from './PomodoroPanel.module.css'

const WORK_MS = 25 * 60 * 1000
const SHORT_BREAK_MS = 5 * 60 * 1000
const LONG_BREAK_MS = 15 * 60 * 1000
const SESSIONS_BEFORE_LONG_BREAK = 4
const PHASE_MS: Record<PomodoroPhase, number> = { work: WORK_MS, 'short-break': SHORT_BREAK_MS, 'long-break': LONG_BREAK_MS }
const PHASE_LABEL_KEYS = {
  work: 'phase.work',
  'short-break': 'phase.shortBreak',
  'long-break': 'phase.longBreak',
} as const satisfies Record<PomodoroPhase, string>
const PHASE_ICONS: Record<PomodoroPhase, string> = { work: '🍅', 'short-break': '☕', 'long-break': '🌿' }
/** CSS-module class carrying the phase accent color (`--pomodoro-phase`). */
const PHASE_CLASSES: Record<PomodoroPhase, keyof typeof styles> = { work: 'work', 'short-break': 'shortBreak', 'long-break': 'longBreak' }
/** Circumference of the progress ring (r=45 in the 100×100 viewBox). */
const RING_CIRCUMFERENCE = 2 * Math.PI * 45

function initialState(): PomodoroState {
  return { phase: 'work', remainingMs: WORK_MS, totalMs: WORK_MS, sessionCount: 0, isRunning: false }
}

/**
 * Advance the timer by one tick, crossing into the next phase when time is up.
 * @param prev - state before the tick.
 * @param elapsedMs - wall-clock milliseconds since the previous tick.
 * @returns the next state; running stops at a phase boundary.
 */
function advance(prev: PomodoroState, elapsedMs: number): PomodoroState {
  const remainingMs = prev.remainingMs - elapsedMs
  if (remainingMs > 0) return { ...prev, remainingMs }
  if (prev.phase === 'work') {
    const sessionCount = prev.sessionCount + 1
    const phase: PomodoroPhase = sessionCount % SESSIONS_BEFORE_LONG_BREAK === 0 ? 'long-break' : 'short-break'
    return { phase, remainingMs: PHASE_MS[phase], totalMs: PHASE_MS[phase], sessionCount, isRunning: false }
  }
  const sessionCount = prev.phase === 'long-break' ? 0 : prev.sessionCount
  return { ...prev, phase: 'work', remainingMs: WORK_MS, totalMs: WORK_MS, sessionCount, isRunning: false }
}

/**
 * @param ms - remaining milliseconds in the current phase.
 * @returns the `MM:SS` label, rounded up so a running timer never shows 00:00.
 */
function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  return `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`
}

/**
 * The Pomodoro tab body: countdown ring, control row, and cycle settings.
 * @param props - seat runtime shares and namespace-bound copy.
 * @returns the timer panel.
 */
export function PomodoroPanel({ t }: PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<'pomodoro'>): ReactNode {
  const [state, setState] = useState<PomodoroState>(initialState)

  useEffect(() => {
    if (!state.isRunning) return
    const local = { current: Date.now() }
    const timer = setInterval(() => {
      const now = Date.now()
      const elapsed = now - local.current
      local.current = now
      setState(prev => (prev.isRunning ? advance(prev, elapsed) : prev))
    }, 250)
    return () => { clearInterval(timer) }
  }, [state.isRunning])

  const start = () => { setState(prev => ({ ...prev, isRunning: true })) }
  const pause = () => { setState(prev => ({ ...prev, isRunning: false })) }
  const reset = () => { setState(initialState()) }
  const skip = () => { setState(prev => advance(prev, prev.remainingMs + 1)) }

  const elapsedFraction = (state.totalMs - state.remainingMs) / state.totalMs
  const sessionsIntoCycle = state.sessionCount % SESSIONS_BEFORE_LONG_BREAK
  const showHint = state.phase === 'work' && sessionsIntoCycle > 0

  return (
    <div className={`${styles.container} ${styles[PHASE_CLASSES[state.phase]]}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t(PHASE_LABEL_KEYS[state.phase])}</h2>
        <span className={styles.badge}>🔥 {state.sessionCount}/{SESSIONS_BEFORE_LONG_BREAK}</span>
      </div>

      <div className={styles.circle}>
        <svg className={styles.progress} viewBox="0 0 100 100">
          <circle className={styles.ringTrack} cx="50" cy="50" r="45" fill="none" />
          <circle
            className={styles.ringBar}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeDasharray={`${elapsedFraction * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          />
        </svg>
        <div className={styles.timeText}>{formatTime(state.remainingMs)}</div>
        <div className={styles.phaseLabel}>
          {state.isRunning
            ? <>{PHASE_ICONS[state.phase]} {t('running')}</>
            : (
              <button type="button" className={styles.startBtn} onClick={start}>
                ▶ {state.remainingMs < state.totalMs ? t('resume') : t('start')}
              </button>
            )}
        </div>
      </div>

      <div className={styles.controls}>
        {state.isRunning
          ? (
            <button type="button" className={`${styles.btn} ${styles.pauseBtn}`} onClick={pause}>⏸ {t('pause')}</button>
          )
          : (
            <button type="button" className={`${styles.btn} ${styles.startRowBtn}`} onClick={start}>▶ {t('start')}</button>
          )}
        <button type="button" className={styles.btn} onClick={reset}>↺ {t('reset')}</button>
        <button type="button" className={styles.btn} onClick={skip}>⏭ {t('skip')}</button>
      </div>

      <div className={styles.settings}>
        <div className={styles.settingRow}>
          <span>{t('workLabel')}</span>
          <strong>{WORK_MS / 60000} {t('minutesUnit')}</strong>
        </div>
        <div className={styles.settingRow}>
          <span>{t('shortBreakLabel')}</span>
          <strong>{SHORT_BREAK_MS / 60000} {t('minutesUnit')}</strong>
        </div>
        <div className={styles.settingRow}>
          <span>{t('longBreakLabel')}</span>
          <strong>{LONG_BREAK_MS / 60000} {t('minutesUnit')}</strong>
        </div>
        {showHint && (
          <div className={`${styles.settingRow} ${styles.hint}`}>
            <span>{t('nextLongBreakHint')}</span>
            <strong>{SESSIONS_BEFORE_LONG_BREAK - sessionsIntoCycle} {t('sessionsLeft')}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
