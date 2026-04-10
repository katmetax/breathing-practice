// Core domain types for breathing presets and sessions.
export interface BreathPreset {
  id: string
  name: string
  inhaleSec: number
  holdInSec: number
  exhaleSec: number
  holdOutSec: number
  isDefault?: boolean
}

export enum BreathPhase {
  INHALE = 'inhale',
  HOLD_IN = 'hold_in',
  EXHALE = 'exhale',
  HOLD_OUT = 'hold_out',
}

export enum StartEndPhase {
  START = 'start',
  END = 'end',
}

export type SessionMode = 'rounds' | 'duration'

export interface SessionConfig {
  mode: SessionMode
  // In rounds mode, number of full inhale→hold_in→exhale→hold_out cycles.
  rounds: number
  // In duration mode, total target seconds for the wall clock.
  totalDurationSec: number
  presetId: string | null
}

export interface BreathSessionRecord {
  id: string
  presetId: string | null
  presetName?: string | null
  durationSeconds: number
  completedAt: string // ISO timestamp
}
