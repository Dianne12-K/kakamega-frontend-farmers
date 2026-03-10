// src/services/api.js
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - DO NOT TRANSFORM HERE
api.interceptors.response.use(
    (response) => response, // ✅ Return full response, not response.data
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
        }
        return Promise.reject(error)
    }
)

// Auth endpoints
export const login = (credentials) => api.post('/auth/login', credentials)
export const signup = (userData) => api.post('/auth/signup', userData)
export const logout = () => api.post('/auth/logout')
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password })
export const getCurrentUser = () => api.get('/auth/me')

export default api