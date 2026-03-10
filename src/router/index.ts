import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TimerPage from '../views/TimerPage.vue';
import HistoryPage from '../views/HistoryPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'timer',
    component: TimerPage,
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
