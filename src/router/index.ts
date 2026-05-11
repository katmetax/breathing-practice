import { createRouter, createWebHistory } from "vue-router"
import type { RouteRecordRaw } from "vue-router"
import TimerPage from "../views/TimerPage.vue"
import SettingsPage from "../views/SettingsPage.vue"
import HistoryPage from "../views/HistoryPage.vue"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "timer",
    component: TimerPage,
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsPage,
  },
  {
    path: "/history",
    name: "history",
    component: HistoryPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
