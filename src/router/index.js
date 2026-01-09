import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: () => import('@/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/Dashboard.vue')
            },
            {
                path: 'farms',
                name: 'Farms',
                component: () => import('@/views/Farms.vue')
            },
            {
                path: '/health',
                name: 'Health',
                component: () => import('@/views/Health.vue')
            },
            {
                path: 'farms/:id',
                name: 'FarmDetail',
                component: () => import('@/views/FarmDetail.vue')
            },
            {
                path: 'farms/add',
                name: 'AddFarm',
                component: () => import('@/views/AddFarm.vue')
            },
            {
                path: 'alerts',
                name: 'Alerts',
                component: () => import('@/views/Alerts.vue')
            },
            {
                path: 'reports',
                name: 'Reports',
                component: () => import('@/views/Reports.vue')
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/Settings.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router