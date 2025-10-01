import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/LogPage.vue'),
    children: [
      {
        path: '',
        redirect: '/login'  //default co sa prve otvori
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



  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
