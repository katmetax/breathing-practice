/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

// Allow TypeScript to import `.vue` SFC files (e.g. `import App from './App.vue'`).
// This is required for TS tooling to understand Vue Single-File Components.
declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
