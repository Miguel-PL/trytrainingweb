import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    meta: { public: true },
    component: () => import('../views/LoginView.vue')
  },
  // TV / kiosk mode (no layout)
  {
    path: '/display/:id',
    name: 'display',
    meta: { public: true },
    component: () => import('../views/DisplayView.vue')
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'workouts',
        name: 'workouts',
        component: () => import('../views/WorkoutsView.vue')
      },
      {
        path: 'exercises',
        name: 'exercises',
        component: () => import('../views/ExercisesView.vue')
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../views/CategoriesView.vue')
      },
      {
        path: 'workouts/:id/edit',
        name: 'workouts.edit',
        component: () => import('../views/EditWorkoutView.vue')
      },
      {
        path: 'exercises/create',
        name: 'exercises.create',
        component: () => import('../views/ExerciseFormView.vue')
      },
      {
        path: 'exercises/:id/edit',
        name: 'exercises.edit',
        component: () => import('../views/ExerciseFormView.vue')
      },
      {
        path: 'workouts/create',
        name: 'workouts.create',
        component: () => import('../views/EditWorkoutView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isPublic = to.matched.some((r) => r.meta?.public)
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth)
  const token = localStorage.getItem('token')
  const isAuthed = Boolean(token)

  if (requiresAuth && !isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && isAuthed) {
    return { name: 'workouts' }
  }

  if (!isPublic && !requiresAuth) {
    // Safety net: if a future route forgets meta, require auth by default.
    if (!isAuthed) return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router