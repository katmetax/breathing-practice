import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import { createRouter, createMemoryHistory } from "vue-router"
import { createPinia, setActivePinia } from "pinia"
import { nextTick } from "vue"
import App from "../App.vue"
import { useThemeStore } from "../stores/theme"

const makeRouter = async (initialPath = "/") => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/settings", component: { template: "<div />" } },
      { path: "/history", component: { template: "<div />" } },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

describe("App", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  async function mountApp(initialPath = "/") {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = await makeRouter(initialPath)
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    return { wrapper, router, pinia }
  }

  it('renders "Breathing Practice" title', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find(".app-title-link").text()).toContain("Breathing Practice")
  })

  it("title click navigates to /", async () => {
    const { wrapper, router } = await mountApp("/settings")
    await wrapper.find(".app-title-link").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.path).toBe("/")
  })

  it("settings link toggles /settings", async () => {
    const { wrapper, router } = await mountApp()
    const settingsLink = wrapper.findAll("a.nav-link")[0]!
    await settingsLink.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.path).toBe("/settings")
    await settingsLink.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.path).toBe("/")
  })

  it("history link toggles /history", async () => {
    const { wrapper, router } = await mountApp()
    const historyLink = wrapper.findAll("a.nav-link")[1]!
    await historyLink.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.path).toBe("/history")
    await historyLink.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.path).toBe("/")
  })

  it("settings link has active class when on /settings", async () => {
    const { wrapper } = await mountApp("/settings")
    const [settingsLink, historyLink] = wrapper.findAll("a.nav-link")
    expect(settingsLink!.classes()).toContain("nav-link--active")
    expect(historyLink!.classes()).not.toContain("nav-link--active")
  })

  it("history link has active class when on /history", async () => {
    const { wrapper } = await mountApp("/history")
    const [settingsLink, historyLink] = wrapper.findAll("a.nav-link")
    expect(historyLink!.classes()).toContain("nav-link--active")
    expect(settingsLink!.classes()).not.toContain("nav-link--active")
  })

  it("no active class on root route", async () => {
    const { wrapper } = await mountApp("/")
    for (const link of wrapper.findAll("a.nav-link")) {
      expect(link.classes()).not.toContain("nav-link--active")
    }
  })

  it("theme button aria-label reflects system preference", async () => {
    const { wrapper, pinia } = await mountApp()
    setActivePinia(pinia)
    useThemeStore().setThemePreference("system")
    await nextTick()
    expect(wrapper.find("button.nav-link--button").attributes("aria-label")).toContain("System")
  })

  it("theme button aria-label reflects light preference", async () => {
    const { wrapper, pinia } = await mountApp()
    setActivePinia(pinia)
    useThemeStore().setThemePreference("light")
    await nextTick()
    expect(wrapper.find("button.nav-link--button").attributes("aria-label")).toContain("Light")
  })

  it("theme button aria-label reflects dark preference", async () => {
    const { wrapper, pinia } = await mountApp()
    setActivePinia(pinia)
    useThemeStore().setThemePreference("dark")
    await nextTick()
    expect(wrapper.find("button.nav-link--button").attributes("aria-label")).toContain("Dark")
  })

  it("clicking theme button calls cycleThemePreference", async () => {
    const { wrapper, pinia } = await mountApp()
    setActivePinia(pinia)
    const themeStore = useThemeStore()
    const spy = vi.spyOn(themeStore, "cycleThemePreference")
    await wrapper.find("button.nav-link--button").trigger("click")
    expect(spy).toHaveBeenCalledOnce()
  })
})
