import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from '../utils/auth.js'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('../App.vue'),
        },
        {
          path: 'report',
          name: 'report',
          component: () => import('../views/ReportPage.vue'),
        },
        {
          path: 'docs',
          name: 'docs',
          component: () => import('../views/DocsPage.vue'),
        },
        {
          path: 'about',
          redirect: '/report',
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: () => (isAuthenticated() ? '/home' : '/login'),
    },
  ],
})

router.beforeEach((to) => {
  const authed = isAuthenticated()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guest = to.matched.some((record) => record.meta.guest)

  if (requiresAuth && !authed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (guest && authed) {
    return { name: 'home' }
  }
})

export default router
