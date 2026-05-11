import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { nextTick } from "vue"
import { useSessionConfigStore } from "../stores/sessionConfig"
import type { BreathPreset } from "../types/breathing"
import { BreathPhase, StartEndPhase } from "../types/breathing"
import type { TimerState } from "../services/timerEngine"

vi.mock("../services/presetManager")
vi.mock("../services/timerEngine")
vi.mock("../services/audioController")
vi.mock("../services/historyService")
vi.mock("../composables/useWakeLock")

import { presetManager } from "../services/presetManager"
import { timerEngine } from "../services/timerEngine"
import { playTone, stopTone } from "../services/audioController"
import { historyService } from "../services/historyService"
import { useWakeLock } from "../composables/useWakeLock"
import TimerPage from "../views/TimerPage.vue"

const mockPreset: BreathPreset = {
  id: "preset_test",
  name: "Test Pattern",
  inhaleSec: 4,
  holdInSec: 0,
  exhaleSec: 4,
  holdOutSec: 0,
  isDefault: false,
}

const mockState = (overrides: Partial<TimerState> = {}): TimerState => ({
  running: true,
  currentPhase: BreathPhase.INHALE,
  currentPhaseElapsed: 0,
  currentRound: 1,
  totalElapsed: 0,
  ...overrides,
})

let pinia: ReturnType<typeof createPinia>
let capturedHandlers: {
  onPhaseChange?: (state: TimerState) => void
  onTick?: (state: TimerState) => void
  onComplete?: (state: TimerState) => void
}

const mountComponent = () => mount(TimerPage, { global: { plugins: [pinia] } })

describe("TimerPage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)

    capturedHandlers = {}

    vi.mocked(presetManager.list).mockReturnValue([mockPreset])
    vi.mocked(timerEngine.init).mockImplementation((_cfg, h) => {
      capturedHandlers = h
    })
    vi.mocked(timerEngine.start).mockImplementation(() => {})
    vi.mocked(timerEngine.stop).mockImplementation(() => {})
    vi.mocked(stopTone).mockImplementation(() => {})
    vi.mocked(playTone).mockImplementation(() => {})
    vi.mocked(historyService.add).mockImplementation(() => {})
    vi.mocked(useWakeLock).mockReturnValue({
      requestWakeLock: vi.fn(),
      releaseWakeLock: vi.fn(),
    })

    const store = useSessionConfigStore()
    store.setSelectedPresetId("preset_test")
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("start button enabled when preset selected", () => {
    const wrapper = mountComponent()
    expect(wrapper.find("[type=submit]").attributes("disabled")).toBeUndefined()
  })

  it("form shown and stop button absent when not running", () => {
    const wrapper = mountComponent()
    expect(wrapper.find("form.form--session").exists()).toBe(true)
    expect(wrapper.find(".btn-ghost").exists()).toBe(false)
  })

  it('countdown shows "Starting in 3…" immediately after submit', async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    await nextTick()
    expect(wrapper.find(".breath-phase-label").text()).toContain("Starting in 3")
    expect(wrapper.find("form.form--session").exists()).toBe(false)
  })

  it("countdown counts down each second", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    await nextTick()

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find(".breath-phase-label").text()).toContain("2")

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find(".breath-phase-label").text()).toContain("1")
  })

  it("session begins after 3-second countdown", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    await nextTick()

    vi.advanceTimersByTime(3000)
    await nextTick()

    expect(vi.mocked(timerEngine.init)).toHaveBeenCalledOnce()
    expect(vi.mocked(timerEngine.start)).toHaveBeenCalledOnce()
    expect(wrapper.find(".btn-ghost").exists()).toBe(true)
    expect(wrapper.find("form.form--session").exists()).toBe(false)
  })

  it("timerEngine.init receives correct config in duration mode", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    const config = vi.mocked(timerEngine.init).mock.calls[0]![0]
    expect(config.phases).toEqual([
      { phase: BreathPhase.INHALE, durationSec: 4 },
      { phase: BreathPhase.EXHALE, durationSec: 4 },
    ])
    expect(config.mode).toBe("duration")
    expect(config.totalDurationSec).toBe(300)
  })

  it("rounds mode sends correct config", async () => {
    const wrapper = mountComponent()
    await wrapper.find(".mode-pill:last-child").trigger("click")
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    const config = vi.mocked(timerEngine.init).mock.calls[0]![0]
    expect(config.mode).toBe("rounds")
    expect(config.rounds).toBe(10)
    expect(config.totalDurationSec).toBeUndefined()
  })

  it("stop during countdown cancels it and form reappears", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    await nextTick()

    vi.advanceTimersByTime(1000)
    await nextTick()

    await wrapper.find(".btn-ghost").trigger("click")
    await nextTick()

    expect(wrapper.find("form.form--session").exists()).toBe(true)
    expect(vi.mocked(timerEngine.init)).not.toHaveBeenCalled()
  })

  it("stop during session calls stop, stopTone, and releaseWakeLock", async () => {
    const mockRelease = vi.fn()
    vi.mocked(useWakeLock).mockReturnValue({
      requestWakeLock: vi.fn(),
      releaseWakeLock: mockRelease,
    })
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    await wrapper.find(".btn-ghost").trigger("click")
    await nextTick()

    expect(vi.mocked(timerEngine.stop)).toHaveBeenCalled()
    expect(vi.mocked(stopTone)).toHaveBeenCalled()
    expect(mockRelease).toHaveBeenCalled()
    expect(wrapper.find("form.form--session").exists()).toBe(true)
  })

  it("onComplete shows duration and records history", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    capturedHandlers.onComplete!(
      mockState({ running: false, currentPhase: null, totalElapsed: 125 }),
    )
    await nextTick()

    expect(wrapper.find(".session-meta").text()).toContain("Session complete5 min")
    expect(vi.mocked(historyService.add)).toHaveBeenCalledWith({
      presetId: mockPreset.id,
      presetName: mockPreset.name,
      durationSeconds: 125,
    })
    expect(vi.mocked(playTone)).toHaveBeenCalledWith(StartEndPhase.END)
  })

  it("onPhaseChange updates phase label and plays tone", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    capturedHandlers.onPhaseChange!(mockState({ currentPhase: BreathPhase.EXHALE }))
    await nextTick()

    expect(wrapper.find(".breath-phase-label").text()).toContain("Exhale")
    expect(vi.mocked(playTone)).toHaveBeenCalledWith(BreathPhase.EXHALE)
  })

  it("round indicator shows current round", async () => {
    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    vi.advanceTimersByTime(3000)
    await nextTick()

    capturedHandlers.onPhaseChange!(mockState({ currentRound: 3 }))
    await nextTick()

    expect(wrapper.find(".session-meta").text()).toContain("Round 3")
  })

  it("all-zero phases shows error and timerEngine not called", async () => {
    const allZeroPreset: BreathPreset = {
      id: "preset_zero",
      name: "Zero",
      inhaleSec: 0,
      holdInSec: 0,
      exhaleSec: 0,
      holdOutSec: 0,
      isDefault: false,
    }
    vi.mocked(presetManager.list).mockReturnValue([allZeroPreset])
    useSessionConfigStore().setSelectedPresetId("preset_zero")

    const wrapper = mountComponent()
    await wrapper.find("form.form--session").trigger("submit")
    await nextTick()

    expect(wrapper.find(".field-error").text()).toContain("no non-zero phases")
    expect(vi.mocked(timerEngine.init)).not.toHaveBeenCalled()
  })

  it("timerEngine.stop called on unmount", () => {
    const wrapper = mountComponent()
    wrapper.unmount()
    expect(vi.mocked(timerEngine.stop)).toHaveBeenCalled()
  })
})
