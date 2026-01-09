// src/stores/farms.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useFarmsStore = defineStore('farms', () => {
    const farms = ref([])
    const selectedFarm = ref(null)
    const loading = ref(false)
    const error = ref(null)

    /* =====================
     * COMPUTED
     * ===================== */
    const healthyFarms = computed(() =>
        farms.value.filter(f => f.current_health?.status === 'healthy')
    )

    const watchFarms = computed(() =>
        farms.value.filter(f => f.current_health?.status === 'watch')
    )

    const criticalFarms = computed(() =>
        farms.value.filter(f => f.current_health?.status === 'critical')
    )

    const averageHealth = computed(() => {
        if (!farms.value.length) return 0
        const total = farms.value.reduce(
            (sum, f) => sum + (f.current_health?.score || 0),
            0
        )
        return Math.round(total / farms.value.length)
    })

    /* =====================
     * FARM CRUD
     * ===================== */
    async function fetchFarms() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/farms')
            farms.value = response.data.farms || response.data || []
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load farms'
            console.error('Fetch farms error:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchFarmById(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/farms/${farmId}`)
            selectedFarm.value = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch farm'
            console.error('Fetch farm error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function addFarm(farmData) {
        loading.value = true
        error.value = null
        try {
            const response = await api.post('/farms', {
                name: farmData.name,
                owner: farmData.owner,
                phone: farmData.phone,
                subcounty_id: farmData.subCountyId,
                ward_id: farmData.wardId,
                location: farmData.location,
                crop_type: farmData.cropType,
                planting_date: farmData.plantingDate,
                area_ha: farmData.size,
                latitude: farmData.latitude,
                longitude: farmData.longitude,
                notes: farmData.notes,
                boundary_geojson: {}
            })

            await fetchFarms() // Refresh list
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to create farm'
            console.error('Add farm error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateFarm(farmId, farmData) {
        loading.value = true
        error.value = null
        try {
            const response = await api.put(`/farms/${farmId}`, farmData)
            await fetchFarms() // Refresh list
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update farm'
            console.error('Update farm error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteFarm(farmId) {
        loading.value = true
        error.value = null
        try {
            await api.delete(`/farms/${farmId}`)
            farms.value = farms.value.filter(f => f.id !== farmId)
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete farm'
            console.error('Delete farm error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /* =====================
     * FARM-SPECIFIC DATA
     * ===================== */
    async function fetchIrrigationSchedule(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/farms/${farmId}/irrigation-schedule`)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch irrigation schedule'
            console.error('Fetch irrigation schedule error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchRecommendation(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/farms/${farmId}/recommendation`)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch recommendation'
            console.error('Fetch recommendation error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        farms,
        selectedFarm,
        loading,
        error,

        // Computed
        healthyFarms,
        watchFarms,
        criticalFarms,
        averageHealth,

        // Actions
        fetchFarms,
        fetchFarmById,
        addFarm,
        updateFarm,
        deleteFarm,
        fetchIrrigationSchedule,
        fetchRecommendation
    }
})