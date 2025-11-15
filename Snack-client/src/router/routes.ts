import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/LogLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/login'
      },
      {
        path: 'login',
        component: () => import('pages/LoginForm.vue'),
      },
      {
        path: 'register',
        component: () => import('pages/RegisterForm.vue')
      }
    ],
  },
  {
    path: '/main',
    component: () => import('layouts/MainLayout.vue'),
  },




  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
