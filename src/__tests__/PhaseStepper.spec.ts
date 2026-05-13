import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import PhaseStepper from "../components/form/PhaseStepper.vue"

const mountStepper = (
  props: {
    label?: string
    modelValue?: string | number
    min?: number
    max?: number
  } = {},
) =>
  mount(PhaseStepper, {
    props: { label: "Inhale", modelValue: 4, ...props },
  })

describe("PhaseStepper", () => {
  it("renders the label", () => {
    const wrapper = mountStepper({ label: "Hold" })
    expect(wrapper.find(".stepper-label").text()).toBe("Hold")
  })

  it("reflects modelValue in the input", () => {
    const wrapper = mountStepper({ modelValue: 7 })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("7")
  })

  it("reflects a string modelValue in the input", () => {
    const wrapper = mountStepper({ modelValue: "3.2" })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("3.2")
  })

  it("emits update:modelValue with the raw string on direct input", async () => {
    const wrapper = mountStepper({ modelValue: 4 })
    await wrapper.find("input").setValue("6")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["6"])
  })

  it("increments by 1 when + is clicked", async () => {
    const wrapper = mountStepper({ modelValue: 4 })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([5])
  })

  it("decrements by 1 when − is clicked", async () => {
    const wrapper = mountStepper({ modelValue: 4 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([3])
  })

  it("does not decrement below min", async () => {
    const wrapper = mountStepper({ modelValue: 0, min: 0 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([0])
  })

  it("does not increment above max", async () => {
    const wrapper = mountStepper({ modelValue: 10, max: 10 })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([10])
  })

  it("defaults min to 0 when not provided", async () => {
    const wrapper = mountStepper({ modelValue: 0 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([0])
  })

  it("defaults max to 60 when not provided", async () => {
    const wrapper = mountStepper({ modelValue: 60 })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([60])
  })

  it("does not emit on increment when modelValue is non-finite", async () => {
    const wrapper = mountStepper({ modelValue: "abc" })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")).toBeUndefined()
  })

  it("does not emit on decrement when modelValue is non-finite", async () => {
    const wrapper = mountStepper({ modelValue: "not-a-number" })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")).toBeUndefined()
  })

  it("treats empty string as 0 and clamps to min on decrement", async () => {
    const wrapper = mountStepper({ modelValue: "", min: 0 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([0])
  })

  it("handles decimal modelValue: increment stays precise", async () => {
    const wrapper = mountStepper({ modelValue: 1.1 })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([2.1])
  })

  it("handles decimal modelValue: decrement stays precise", async () => {
    const wrapper = mountStepper({ modelValue: 2.9 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([1.9])
  })

  it("clamps to min when value is already below min", async () => {
    const wrapper = mountStepper({ modelValue: -5, min: 0 })
    await wrapper.find(".stepper-btn--dec").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([0])
  })

  it("clamps to max when value is already above max", async () => {
    const wrapper = mountStepper({ modelValue: 100, max: 60 })
    await wrapper.find(".stepper-btn--inc").trigger("click")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([60])
  })

  it("emits blur when input is blurred", async () => {
    const wrapper = mountStepper()
    await wrapper.find("input").trigger("blur")
    expect(wrapper.emitted("blur")).toBeTruthy()
  })

  it("emits beforeinput when input fires beforeinput", async () => {
    const wrapper = mountStepper()
    await wrapper.find("input").trigger("beforeinput")
    expect(wrapper.emitted("beforeinput")).toBeTruthy()
  })

  it("emits paste when input fires paste", async () => {
    const wrapper = mountStepper()
    await wrapper.find("input").trigger("paste")
    expect(wrapper.emitted("paste")).toBeTruthy()
  })

  it("sets min attribute on the input", () => {
    const wrapper = mountStepper({ min: 1 })
    expect(wrapper.find("input").attributes("min")).toBe("1")
  })

  it("sets max attribute on the input", () => {
    const wrapper = mountStepper({ max: 30 })
    expect(wrapper.find("input").attributes("max")).toBe("30")
  })
})
