// src/stores/weather.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useWeatherStore = defineStore('weather', () => {
    const currentWeather = ref(null)
    const forecast = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Cache to avoid refetching same location
    const weatherCache = ref({})

    /**
     * Fetch weather by coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} days - Number of days (default: 7)
     */
    async function fetchWeather(lat, lon, days = 7) {
        const cacheKey = `${lat},${lon},${days}`

        // Return cached data if less than 30 minutes old
        if (weatherCache.value[cacheKey]) {
            const cached = weatherCache.value[cacheKey]
            const age = Date.now() - cached.timestamp
            if (age < 30 * 60 * 1000) { // 30 minutes
                currentWeather.value = cached.data.current
                forecast.value = cached.data.forecast
                return cached.data
            }
        }

        loading.value = true
        error.value = null
        try {
            const response = await api.get('/weather', {
                params: { lat, lon, days }
            })

            currentWeather.value = response.data.current || response.data
            forecast.value = response.data.forecast || []

            // Cache the result
            weatherCache.value[cacheKey] = {
                data: response.data,
                timestamp: Date.now()
            }

            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch weather'
            console.error('Fetch weather error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    function clearCache() {
        weatherCache.value = {}
    }

    return {
        currentWeather,
        forecast,
        loading,
        error,
        fetchWeather,
        clearCache
    }
})