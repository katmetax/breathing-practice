import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { historyService as HistoryServiceType } from "../services/historyService"
import type { BreathSessionRecord } from "../types/breathing"

describe("historyService", () => {
  let service: typeof HistoryServiceType

  beforeEach(async () => {
    const store: Record<string, string> = {}
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v
      },
      removeItem: (k: string) => {
        delete store[k]
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k]
      },
    })
    vi.resetModules()
    const mod = await import("../services/historyService")
    service = mod.historyService
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("listAll returns empty array when storage is empty", () => {
    expect(service.listAll()).toEqual([])
  })

  it("listAll returns sessions stored in localStorage", () => {
    const sessions: BreathSessionRecord[] = [
      {
        id: "s1",
        presetId: "p1",
        presetName: "Box",
        durationSeconds: 60,
        completedAt: "2024-01-01T00:00:00.000Z",
      },
    ]
    localStorage.setItem("breathing_sessions_v1", JSON.stringify(sessions))
    expect(service.listAll()).toEqual(sessions)
  })

  it("add stores a session with a generated id and completedAt timestamp", () => {
    const before = Date.now()
    service.add({ presetId: "p1", presetName: "Box", durationSeconds: 60 })
    const after = Date.now()

    const [session] = service.listAll()
    expect(session).toBeDefined()
    expect(session!.presetId).toBe("p1")
    expect(session!.presetName).toBe("Box")
    expect(session!.id).toMatch(/^session_/)
    const ts = new Date(session!.completedAt).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it("add persists sessions to localStorage", () => {
    service.add({ presetId: null, presetName: "Custom", durationSeconds: 30 })
    const raw = localStorage.getItem("breathing_sessions_v1")
    expect(raw).not.toBeNull()
    const [record]: BreathSessionRecord[] = JSON.parse(raw!)
    expect(record).toBeDefined()
    expect(record!.presetName).toBe("Custom")
  })

  it("listRecent returns sessions sorted newest first", () => {
    const sessions: BreathSessionRecord[] = [
      {
        id: "1",
        presetId: null,
        presetName: "A",
        durationSeconds: 10,
        completedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        presetId: null,
        presetName: "B",
        durationSeconds: 20,
        completedAt: "2024-01-03T00:00:00.000Z",
      },
      {
        id: "3",
        presetId: null,
        presetName: "C",
        durationSeconds: 30,
        completedAt: "2024-01-02T00:00:00.000Z",
      },
    ]
    localStorage.setItem("breathing_sessions_v1", JSON.stringify(sessions))

    const [first, second, third] = service.listRecent()
    expect(first?.id).toBe("2")
    expect(second?.id).toBe("3")
    expect(third?.id).toBe("1")
  })

  it("listRecent respects the limit parameter", () => {
    const sessions: BreathSessionRecord[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      presetId: null,
      presetName: `P${i}`,
      durationSeconds: i * 10,
      completedAt: `2024-01-0${i + 1}T00:00:00.000Z`,
    }))
    localStorage.setItem("breathing_sessions_v1", JSON.stringify(sessions))

    expect(service.listRecent(3)).toHaveLength(3)
  })

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("breathing_sessions_v1", "not valid json{{")
    expect(service.listAll()).toEqual([])
  })
})
