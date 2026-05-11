import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import FormField from "../components/form/FormField.vue"

const mountField = (props: { label?: string; modelValue?: string | number } = {}, attrs = {}) =>
  mount(FormField, {
    props: { label: "Test", modelValue: "", ...props },
    attrs,
  })

describe("FormField", () => {
  it("renders the label text", () => {
    const wrapper = mountField({ label: "Inhale" })
    expect(wrapper.find(".field-label").text()).toBe("Inhale")
  })

  it("reflects a string modelValue in the input", () => {
    const wrapper = mountField({ modelValue: "Box Breath" })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("Box Breath")
  })

  it("reflects a number modelValue in the input", () => {
    const wrapper = mountField({ modelValue: 4 })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("4")
  })

  it("emits update:modelValue with the typed string on input", async () => {
    const wrapper = mountField()
    await wrapper.find("input").setValue("5")
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["5"])
  })

  it("passes extra attributes to the input, not the root label", () => {
    const wrapper = mountField({}, { type: "number", min: "1", max: "60", required: true })
    const input = wrapper.find("input").element as HTMLInputElement
    expect(input.type).toBe("number")
    expect(input.getAttribute("min")).toBe("1")
    expect(input.getAttribute("max")).toBe("60")
    expect(input.required).toBe(true)
    expect(wrapper.find("label").element.hasAttribute("type")).toBe(false)
  })

  it("passes placeholder through to the input", () => {
    const wrapper = mountField({}, { placeholder: "e.g. Box Breath" })
    expect((wrapper.find("input").element as HTMLInputElement).placeholder).toBe("e.g. Box Breath")
  })

  it("forwards event listeners to the input", async () => {
    const onBlur = vi.fn()
    const wrapper = mountField({}, { onBlur })
    await wrapper.find("input").trigger("blur")
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it("does not apply forwarded listeners to the root label", async () => {
    const onBlur = vi.fn()
    const wrapper = mountField({}, { onBlur })
    await wrapper.find("label").trigger("blur")
    expect(onBlur).not.toHaveBeenCalled()
  })
})
