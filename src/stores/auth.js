import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const token = ref(localStorage.getItem('token') || null)
    const isAuthenticated = ref(!!token.value)

    const login = async (credentials) => {
        try {
            // TODO: Replace with actual API call
            // For demo purposes, accepting any credentials
            const response = {
                user: {
                    id: 1,
                    name: credentials.email.split('@')[0],
                    email: credentials.email,
                    role: 'Extension Officer',
                    region: 'Malava Sub-County'
                },
                token: 'demo-token-' + Date.now()
            }

            user.value = response.user
            token.value = response.token
            isAuthenticated.value = true
            localStorage.setItem('token', response.token)
            localStorage.setItem('user', JSON.stringify(response.user))

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const logout = () => {
        user.value = null
        token.value = null
        isAuthenticated.value = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const loadUser = () => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            user.value = JSON.parse(savedUser)
        }
    }

    // Load user on store creation
    if (token.value) {
        loadUser()
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        loadUser
    }
})