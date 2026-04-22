import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'workouts',
        component: () => import('../views/WorkoutsView.vue')
      },
      {
        path: 'exercises',
        component: () => import('../views/ExercisesView.vue')
      },
      {
        path: 'categories',
        component: () => import('../views/CategoriesView.vue')
      },
      {
        path: '/display/:id',
        component: () => import('../views/DisplayView.vue')
      },
      {
        path: '/workouts/:id/edit',
        component: () => import('../views/EditWorkoutView.vue')
      },
      {
        path: '/exercises',
        component: () => import('../views/ExercisesView.vue')
      },
      {
        path: '/exercises/create',
        component: () => import('../views/ExerciseFormView.vue')
      },
      {
        path: '/exercises/:id/edit',
        component: () => import('../views/ExerciseFormView.vue')
      },
      {
        path: '/workouts/create',
        component: () => import('../views/EditWorkoutView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router