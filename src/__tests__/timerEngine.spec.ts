import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { timerEngine as TimerEngineType, TimerConfig } from '../services/timerEngine'
import { BreathPhase } from '../types/breathing'

describe('timerEngine', () => {
  let engine: typeof TimerEngineType
  let rafCallback: FrameRequestCallback | null = null
  let mockCancelRAF: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    rafCallback = null
    mockCancelRAF = vi.fn()

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', mockCancelRAF)
    vi.spyOn(performance, 'now').mockReturnValue(0)

    vi.resetModules()
    const mod = await import('../services/timerEngine')
    engine = mod.timerEngine
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function tick(timestamp: number) {
    const cb = rafCallback
    rafCallback = null
    cb?.(timestamp)
  }

  const twoPhaseConfig: TimerConfig = {
    phases: [
      { phase: BreathPhase.INHALE, durationSec: 4 },
      { phase: BreathPhase.EXHALE, durationSec: 4 },
    ],
    rounds: 2,
    mode: 'rounds',
  }

  it('getState returns non-running state before init', () => {
    const state = engine.getState()
    expect(state.running).toBe(false)
    expect(state.currentPhase).toBeNull()
    expect(state.totalElapsed).toBe(0)
    expect(state.currentRound).toBe(0)
  })

  it('init sets currentPhase to the first phase and resets round to 1', () => {
    engine.init(twoPhaseConfig, {})
    const state = engine.getState()
    expect(state.currentPhase).toBe(BreathPhase.INHALE)
    expect(state.currentRound).toBe(1)
    expect(state.running).toBe(false)
    expect(state.totalElapsed).toBe(0)
  })

  it('start sets running to true and fires onPhaseChange', () => {
    const onPhaseChange = vi.fn()
    engine.init(twoPhaseConfig, { onPhaseChange })
    engine.start()
    expect(engine.getState().running).toBe(true)
    expect(onPhaseChange).toHaveBeenCalledOnce()
    expect(onPhaseChange.mock.calls[0]?.[0].currentPhase).toBe(BreathPhase.INHALE)
  })

  it('start is a no-op when not yet configured', () => {
    engine.start()
    expect(engine.getState().running).toBe(false)
    expect(rafCallback).toBeNull()
  })

  it('start is a no-op when already running', () => {
    const onPhaseChange = vi.fn()
    engine.init(twoPhaseConfig, { onPhaseChange })
    engine.start()
    engine.start()
    expect(onPhaseChange).toHaveBeenCalledOnce()
  })

  it('stop cancels the animation frame and sets running to false', () => {
    engine.init(twoPhaseConfig, {})
    engine.start()
    engine.stop()
    expect(engine.getState().running).toBe(false)
    expect(mockCancelRAF).toHaveBeenCalled()
  })

  it('tick advances totalElapsed and currentPhaseElapsed', () => {
    const onTick = vi.fn()
    engine.init(twoPhaseConfig, { onTick })
    engine.start()
    tick(0)      // delta = 0
    tick(2000)   // delta = 2s
    const lastState = onTick.mock.calls[onTick.mock.calls.length - 1]![0]
    expect(lastState.totalElapsed).toBeCloseTo(2)
    expect(lastState.currentPhaseElapsed).toBeCloseTo(2)
  })

  it('transitions to the next phase when the current phase duration elapses', () => {
    const onPhaseChange = vi.fn()
    engine.init(twoPhaseConfig, { onPhaseChange })
    engine.start()   // fires onPhaseChange once
    tick(0)
    tick(4100)       // inhale (4s) done → exhale
    expect(onPhaseChange).toHaveBeenCalledTimes(2)
    expect(engine.getState().currentPhase).toBe(BreathPhase.EXHALE)
    expect(engine.getState().currentPhaseElapsed).toBeCloseTo(0)
  })

  it('advances the round number when the last phase of a round completes', () => {
    engine.init(twoPhaseConfig, {})  // rounds: 2
    engine.start()
    tick(0)
    tick(4100)   // inhale done → exhale
    tick(8200)   // exhale (last phase) done → round 2, back to inhale
    const state = engine.getState()
    expect(state.currentRound).toBe(2)
    expect(state.currentPhase).toBe(BreathPhase.INHALE)
  })

  it('calls onComplete and stops when all rounds finish in rounds mode', () => {
    const onComplete = vi.fn()
    engine.init({ ...twoPhaseConfig, rounds: 1 }, { onComplete })
    engine.start()
    tick(0)
    tick(4100)   // inhale done → exhale
    tick(8200)   // exhale (last phase, last round) → complete
    expect(onComplete).toHaveBeenCalledOnce()
    expect(engine.getState().running).toBe(false)
  })

  it('calls onComplete and stops after the configured number of rounds in rounds mode', () => {
    const onComplete = vi.fn()
    // 2-round config: inhale 4s + exhale 4s = 8s per round, 2 rounds = 16s total
    engine.init({ ...twoPhaseConfig, rounds: 2 }, { onComplete })
    engine.start()
    tick(0)
    tick(4100)    // inhale done → exhale (round 1)
    tick(8200)    // exhale done → inhale (round 2)
    tick(12300)   // inhale done → exhale (round 2)
    expect(onComplete).not.toHaveBeenCalled()
    tick(16400)   // exhale done → last phase of last round → complete
    expect(onComplete).toHaveBeenCalledOnce()
    expect(engine.getState().running).toBe(false)
  })

  it('calls onComplete after a full round completes once totalDurationSec is exceeded in duration mode', () => {
    const onComplete = vi.fn()
    // 4s inhale + 4s exhale = 8s per round; set duration to 10s so it stops after round 2 (16s)
    engine.init(
      { ...twoPhaseConfig, mode: 'duration', totalDurationSec: 10 },
      { onComplete },
    )
    engine.start()
    tick(0)
    tick(4100)    // inhale done → exhale (round 1)
    tick(8200)    // exhale done → end of round 1 (8.2s < 10s, keep going)
    expect(onComplete).not.toHaveBeenCalled()
    tick(12300)   // inhale done → exhale (round 2)
    expect(onComplete).not.toHaveBeenCalled()
    tick(16400)   // exhale done → end of round 2 (16.4s >= 10s) → complete
    expect(onComplete).toHaveBeenCalledOnce()
    expect(engine.getState().running).toBe(false)
  })

  it('does not stop mid-round in duration mode even when totalDurationSec is exceeded', () => {
    const onComplete = vi.fn()
    // 4s inhale + 4s exhale = 8s per round; set duration to 5s
    // The timer should NOT stop after inhale (5s > 4s) — it must wait for the full round
    engine.init(
      { ...twoPhaseConfig, mode: 'duration', totalDurationSec: 5 },
      { onComplete },
    )
    engine.start()
    tick(0)
    tick(4100)    // inhale done → exhale; totalElapsed 4.1s (< 5s, round not done yet)
    expect(onComplete).not.toHaveBeenCalled()
    tick(5200)    // mid-exhale; totalElapsed 5.2s (> 5s, but still mid-round)
    expect(onComplete).not.toHaveBeenCalled()
    tick(8200)    // exhale done → end of round 1 (>= 5s) → complete
    expect(onComplete).toHaveBeenCalledOnce()
    expect(engine.getState().running).toBe(false)
  })

  it('calls onComplete immediately when phases array is empty', () => {
    const onComplete = vi.fn()
    engine.init({ phases: [], rounds: 1, mode: 'rounds' }, { onComplete })
    engine.start()
    tick(0)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('re-init while running stops the current session and resets state', () => {
    const onComplete = vi.fn()
    engine.init(twoPhaseConfig, { onComplete })
    engine.start()
    tick(0)
    tick(2000)  // mid-session

    engine.init(twoPhaseConfig, {})  // re-init should stop and reset

    expect(engine.getState().running).toBe(false)
    expect(engine.getState().totalElapsed).toBe(0)
    expect(engine.getState().currentRound).toBe(1)
    expect(onComplete).not.toHaveBeenCalled()
  })
})
