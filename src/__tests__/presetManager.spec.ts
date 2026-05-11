import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { presetManager as PresetManagerType } from "../services/presetManager"
import type { BreathPreset } from "../types/breathing"

describe("presetManager", () => {
  let service: typeof PresetManagerType

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
    const mod = await import("../services/presetManager")
    service = mod.presetManager
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("list seeds a Box Breath default when storage is empty", () => {
    const presets = service.list()
    expect(presets).toHaveLength(1)
    expect(presets[0]).toMatchObject({
      id: "box_default",
      name: "Box Breath",
      inhaleSec: 4,
      holdInSec: 4,
      exhaleSec: 4,
      holdOutSec: 4,
      isDefault: true,
    })
  })

  it("list seeds and persists the default to localStorage", () => {
    service.list()
    const raw = localStorage.getItem("breathing_presets_v1")
    expect(raw).not.toBeNull()
    const [record]: BreathPreset[] = JSON.parse(raw!)
    expect(record!.id).toBe("box_default")
  })

  it("list returns presets stored in localStorage", () => {
    const stored: BreathPreset[] = [
      { id: "p1", name: "Custom", inhaleSec: 5, holdInSec: 0, exhaleSec: 5, holdOutSec: 0 },
    ]
    localStorage.setItem("breathing_presets_v1", JSON.stringify(stored))
    expect(service.list()).toEqual(stored)
  })

  it("getById finds a preset by id", () => {
    const stored: BreathPreset[] = [
      { id: "p1", name: "Custom", inhaleSec: 5, holdInSec: 0, exhaleSec: 5, holdOutSec: 0 },
    ]
    localStorage.setItem("breathing_presets_v1", JSON.stringify(stored))
    expect(service.getById("p1")).toEqual(stored[0])
  })

  it("getById returns undefined for an unknown id", () => {
    expect(service.getById("does-not-exist")).toBeUndefined()
  })

  it("create returns a preset with a generated id", () => {
    const created = service.create({
      name: "New",
      inhaleSec: 4,
      holdInSec: 0,
      exhaleSec: 6,
      holdOutSec: 0,
    })
    expect(created.id).toMatch(/^preset_/)
    expect(created.name).toBe("New")
  })

  it("create adds the preset to the list", () => {
    const created = service.create({
      name: "Added",
      inhaleSec: 3,
      holdInSec: 1,
      exhaleSec: 5,
      holdOutSec: 1,
    })
    expect(service.getById(created.id)).toEqual(created)
  })

  it("create persists the new preset to localStorage", () => {
    service.create({ name: "Persisted", inhaleSec: 3, holdInSec: 1, exhaleSec: 5, holdOutSec: 1 })
    const raw = localStorage.getItem("breathing_presets_v1")
    const parsed: BreathPreset[] = JSON.parse(raw!)
    expect(parsed.some((p) => p.name === "Persisted")).toBe(true)
  })

  it("update modifies an existing preset in place", () => {
    const created = service.create({
      name: "Old Name",
      inhaleSec: 3,
      holdInSec: 0,
      exhaleSec: 3,
      holdOutSec: 0,
    })
    const updated = service.update({ ...created, name: "New Name" })
    expect(updated.name).toBe("New Name")
    expect(service.getById(created.id)?.name).toBe("New Name")
    expect(service.list().filter((p) => p.id === created.id)).toHaveLength(1)
  })

  it("update inserts a preset when the id is not found", () => {
    const ghost: BreathPreset = {
      id: "ghost",
      name: "Ghost",
      inhaleSec: 4,
      holdInSec: 4,
      exhaleSec: 4,
      holdOutSec: 4,
    }
    service.update(ghost)
    expect(service.getById("ghost")).toEqual(ghost)
  })

  it("delete removes the preset from the list", () => {
    const created = service.create({
      name: "ToDelete",
      inhaleSec: 4,
      holdInSec: 0,
      exhaleSec: 4,
      holdOutSec: 0,
    })
    service.delete(created.id)
    expect(service.getById(created.id)).toBeUndefined()
  })

  it("delete persists the removal to localStorage", () => {
    const created = service.create({
      name: "Bye",
      inhaleSec: 4,
      holdInSec: 0,
      exhaleSec: 4,
      holdOutSec: 0,
    })
    service.delete(created.id)
    const raw = localStorage.getItem("breathing_presets_v1")
    const parsed: BreathPreset[] = JSON.parse(raw!)
    expect(parsed.some((p) => p.id === created.id)).toBe(false)
  })

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("breathing_presets_v1", "{bad json")
    expect(service.list()).toEqual([])
  })
})
