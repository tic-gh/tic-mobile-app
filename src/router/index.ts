import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { isStoredTokenExpired } from '@/util/jwt';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/login',
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/download',
    component: () => import('@/views/DownloadPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/complex-home',
    component: () => import('@/views/ComplexHomePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/list',
    component: () => import('@/views/ListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/render/:key',
    name: 'renderPage',
    component: () => import('@/views/RenderPage.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    if (isStoredTokenExpired()) {
      localStorage.removeItem('access_token');
      next('/login');
      return;
    }
  }

  next();
});

export default router;
