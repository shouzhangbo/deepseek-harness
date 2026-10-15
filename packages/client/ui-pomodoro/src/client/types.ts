/** Pomodoro Timer — public type definitions. */

/** A timer cycle phase: focus work, a short break, or a long break. */
export type PomodoroPhase = 'work' | 'short-break' | 'long-break'

/** The state of one Pomodoro tab instance. */
export interface PomodoroState {
  /** Current phase of the cycle. */
  phase: PomodoroPhase
  /** Remaining milliseconds in the current phase. */
  remainingMs: number
  /** Total duration of the current phase in milliseconds. */
  totalMs: number
  /** Completed work sessions since the last long break. */
  sessionCount: number
  /** Whether the countdown is running. */
  isRunning: boolean
}
