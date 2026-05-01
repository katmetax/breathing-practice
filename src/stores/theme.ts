import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'breathing_theme_preference_v1'
const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark']
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === 'system' || value === 'light' || value === 'dark'
}

const readStoredThemePreference = (): ThemePreference => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(value)) {
      return value
    }
  } catch {
    // Ignore storage access failures and use defaults.
  }
  return 'system'
}

const persistThemePreference = (value: ThemePreference) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures to keep the app usable.
  }
}

const readSystemTheme = (): ResolvedTheme => {
  if (!window.matchMedia(DARK_MODE_MEDIA_QUERY).matches) {
    return 'light'
  }
  return 'dark'
}

const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#f7fafc', dark: '#070d17' }
const MEDIA_QUERY_COLORS: Record<string, string> = {
  '(prefers-color-scheme: light)': THEME_COLORS.light,
  '(prefers-color-scheme: dark)': THEME_COLORS.dark,
}

const applyThemeToDom = (preference: ThemePreference, resolved: ResolvedTheme) => {
  const root = document.documentElement
  root.dataset.theme = preference
  root.style.colorScheme = resolved

  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (preference === 'system') {
      meta.content = MEDIA_QUERY_COLORS[meta.media] ?? THEME_COLORS[resolved]
    } else {
      meta.content = THEME_COLORS[resolved]
    }
  })
}

let mediaQueryList: MediaQueryList | null = null
let hasMediaQueryListener = false

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(readStoredThemePreference())
  const systemTheme = ref<ResolvedTheme>(readSystemTheme())

  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (preference.value === 'system') {
      return systemTheme.value
    }
    return preference.value
  })

  const applyTheme = () => {
    applyThemeToDom(preference.value, resolvedTheme.value)
  }

  const setThemePreference = (next: ThemePreference) => {
    preference.value = next
    persistThemePreference(next)
    applyTheme()
  }

  const cycleThemePreference = () => {
    const currentIndex = THEME_ORDER.indexOf(preference.value)
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length
    const nextPreference = THEME_ORDER[nextIndex] ?? 'system'
    setThemePreference(nextPreference)
  }

  const initializeTheme = () => {
    systemTheme.value = readSystemTheme()
    applyTheme()

    if (hasMediaQueryListener) {
      return
    }

    mediaQueryList = window.matchMedia(DARK_MODE_MEDIA_QUERY)
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      systemTheme.value = event.matches ? 'dark' : 'light'
      if (preference.value === 'system') {
        applyTheme()
      }
    }

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', onSystemThemeChange)
    } else {
      mediaQueryList.addEventListener('change', onSystemThemeChange)
    }
    hasMediaQueryListener = true
  }

  return {
    preference,
    resolvedTheme,
    initializeTheme,
    setThemePreference,
    cycleThemePreference,
  }
})
