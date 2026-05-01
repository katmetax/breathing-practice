import type { BreathPhase } from '../types/breathing'

export interface PhaseTiming {
  phase: BreathPhase
  durationSec: number
}

export interface TimerConfig {
  phases: PhaseTiming[]
  rounds: number
  mode: 'rounds' | 'duration'
  totalDurationSec?: number
}

export interface TimerState {
  running: boolean
  currentPhase: BreathPhase | null
  currentPhaseElapsed: number
  currentRound: number
  totalElapsed: number
}

export type PhaseChangeCallback = (state: TimerState) => void
export type TickCallback = (state: TimerState) => void
export type CompleteCallback = (state: TimerState) => void

/**
 * High-precision timer engine that uses requestAnimationFrame.
 * In a production app you might move this into a dedicated Web Worker.
 *
 * This implementation focuses on the happy path and keeps the API simple.
 */
class TimerEngine {
  private config: TimerConfig | null = null
  private state: TimerState = {
    running: false,
    currentPhase: null,
    currentPhaseElapsed: 0,
    currentRound: 0,
    totalElapsed: 0,
  }

  private lastTimestamp: number | null = null
  private rafId: number | null = null

  private onPhaseChange?: PhaseChangeCallback
  private onTick?: TickCallback
  private onComplete?: CompleteCallback

  init(
    config: TimerConfig,
    handlers: {
      onPhaseChange?: PhaseChangeCallback
      onTick?: TickCallback
      onComplete?: CompleteCallback
    },
  ) {
    this.stop()

    this.config = config
    this.onPhaseChange = handlers.onPhaseChange
    this.onTick = handlers.onTick
    this.onComplete = handlers.onComplete

    this.state = {
      running: false,
      currentPhase: config.phases[0]?.phase ?? null,
      currentPhaseElapsed: 0,
      currentRound: 1,
      totalElapsed: 0,
    }
    this.lastTimestamp = null
  }

  start() {
    if (!this.config) return
    if (this.state.running) return

    this.state.running = true
    this.lastTimestamp = performance.now()
    this.rafId = requestAnimationFrame(this.tickInternal)
    this.onPhaseChange?.({ ...this.state })
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.state.running = false
    this.lastTimestamp = null
  }

  getState(): TimerState {
    return { ...this.state }
  }

  /**
   * Internal frame handler. We track elapsed time using the high-resolution
   * performance clock, which is resilient to most throttling scenarios.
   */
  private tickInternal = (timestamp: number) => {
    if (!this.state.running || !this.config) return

    const { phases, rounds, mode, totalDurationSec } = this.config
    if (phases.length === 0) {
      // No phases to run; complete immediately.
      this.complete()
      return
    }

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp
    }

    const deltaSec = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    this.state.totalElapsed += deltaSec
    this.state.currentPhaseElapsed += deltaSec

    const currentPhaseIndex = phases.findIndex((p) => p.phase === this.state.currentPhase)
    const currentPhaseConfig = phases[currentPhaseIndex]

    if (!currentPhaseConfig) {
      this.complete()
      return
    }

    // Handle phase transition when the current phase duration has elapsed.
    if (this.state.currentPhaseElapsed >= currentPhaseConfig.durationSec) {
      this.state.currentPhaseElapsed = 0

      const isLastPhase = currentPhaseIndex === phases.length - 1

      if (isLastPhase) {
        // One round completed.
        if (mode === 'rounds') {
          if (this.state.currentRound >= rounds) {
            this.complete()
            return
          }
        } else if (mode === 'duration' && typeof totalDurationSec === 'number') {
          if (this.state.totalElapsed >= totalDurationSec) {
            this.complete()
            return
          }
        }

        this.state.currentRound += 1
        this.state.currentPhase = phases[0]?.phase ?? null
        this.onPhaseChange?.({ ...this.state })
      } else {
        // Move to next phase within the same round.
        this.state.currentPhase = phases[currentPhaseIndex + 1]?.phase ?? null
        this.onPhaseChange?.({ ...this.state })
      }
    }

    this.onTick?.({ ...this.state })
    this.rafId = requestAnimationFrame(this.tickInternal)
  }

  private complete() {
    this.stop()
    this.onComplete?.({ ...this.state })
  }
}

// Singleton instance for the entire frontend.
export const timerEngine = new TimerEngine()
