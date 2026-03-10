// src/stores/farms.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useFarmsStore = defineStore('farms', () => {
    const farms        = ref([])
    const selectedFarm = ref(null)
    const loading      = ref(false)
    const error        = ref(null)

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
            (sum, f) => sum + (f.current_health?.score || 0), 0
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
                name:             farmData.name,
                owner:            farmData.owner,
                phone:            farmData.phone,
                subcounty_id:     farmData.subCountyId,
                ward_id:          farmData.wardId,
                location:         farmData.location,
                crop_type:        farmData.cropType,
                planting_date:    farmData.plantingDate,
                area_ha:          farmData.size,
                latitude:         farmData.latitude,
                longitude:        farmData.longitude,
                notes:            farmData.notes,
                boundary_geojson: {}
            })
            await fetchFarms()
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
            await fetchFarms()
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
     * FARM HEALTH & AGRI
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

    /* =====================
     * SATELLITE / GEE
     * ===================== */

    // Fetch fresh NDVI from GEE for a farm
    async function fetchFarmNDVI(farmId, days = 30) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/ndvi`, {
                params: { days }
            })
            // Merge ndvi into the farm object in the list
            const farm = farms.value.find(f => f.id === farmId)
            if (farm) {
                farm.latest_ndvi    = response.data.latest_ndvi
                farm.health_score   = response.data.health_score
                farm.health_status  = response.data.health_status
            }
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch NDVI'
            console.error('Farm NDVI error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Fetch all spectral indices (NDVI + EVI + moisture) in one call
    async function fetchFarmIndices(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/indices`)
            const farm = farms.value.find(f => f.id === farmId)
            if (farm) {
                farm.indices = response.data.indices
            }
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch farm indices'
            console.error('Farm indices error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Trigger a manual GEE data refresh
    async function refreshFarmSatelliteData(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.post(`/satellite/farms/${farmId}/refresh`)
            // Re-fetch the farm to get updated data
            await fetchFarmById(farmId)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to refresh satellite data'
            console.error('Satellite refresh error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Fetch saved satellite imagery history from DB
    async function fetchFarmSatelliteHistory(farmId, days = 90) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/history`, {
                params: { days }
            })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch satellite history'
            console.error('Satellite history error:', err)
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

        // CRUD
        fetchFarms,
        fetchFarmById,
        addFarm,
        updateFarm,
        deleteFarm,

        // Agri
        fetchIrrigationSchedule,
        fetchRecommendation,

        // Satellite
        fetchFarmNDVI,
        fetchFarmIndices,
        refreshFarmSatelliteData,
        fetchFarmSatelliteHistory,
    }
})