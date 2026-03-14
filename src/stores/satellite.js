// src/stores/satellite.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useSatelliteStore = defineStore('satellite', () => {
    const ndviData      = ref({})   // keyed by farm_id
    const indicesData   = ref({})   // keyed by farm_id
    const historyData   = ref({})   // keyed by farm_id
    const coverage      = ref(null)
    const loading       = ref(false)
    const refreshing    = ref(false)
    const error         = ref(null)

    // ── NDVI ─────────────────────────────────────────────────
    async function fetchNDVI(farmId, days = 30) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/ndvi`, {
                params: { days }
            })
            ndviData.value[farmId] = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch NDVI'
            console.error('NDVI fetch error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── All Indices (NDVI + EVI + Moisture) ──────────────────
    async function fetchIndices(farmId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/indices`)
            indicesData.value[farmId] = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch indices'
            console.error('Indices fetch error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Manual Refresh ────────────────────────────────────────
    async function refreshFarmData(farmId) {
        refreshing.value = true
        error.value = null
        try {
            const response = await api.post(`/satellite/farms/${farmId}/refresh`)
            // Clear cached data so next fetch is fresh
            delete ndviData.value[farmId]
            delete indicesData.value[farmId]
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to refresh satellite data'
            console.error('Refresh error:', err)
            throw err
        } finally {
            refreshing.value = false
        }
    }

    // ── History ───────────────────────────────────────────────
    async function fetchHistory(farmId, days = 90) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/satellite/farms/${farmId}/history`, {
                params: { days }
            })
            historyData.value[farmId] = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch satellite history'
            console.error('History fetch error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Coverage Summary ──────────────────────────────────────
    async function fetchCoverage() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/satellite/coverage')
            coverage.value = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch coverage'
            console.error('Coverage fetch error:', err)
        } finally {
            loading.value = false
        }
    }

    // ── Phase 3: Zonal Stats ──────────────────────────────────
    async function fetchZonalStats(farmId, days = 30) {
        loading.value = true
        try {
            const response = await api.get(`/satellite/farms/${farmId}/zonal-stats`, { params: { days } })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch zonal stats'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Phase 3: Change Detection ─────────────────────────────
    async function fetchChangeDetection(farmId, days = 30) {
        loading.value = true
        try {
            const response = await api.get(`/satellite/farms/${farmId}/change-detection`, { params: { days } })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch change detection'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Phase 3: Stress Hotspots ──────────────────────────────
    async function fetchHotspots(farmId, days = 30, gridSize = 3) {
        loading.value = true
        try {
            const response = await api.get(`/satellite/farms/${farmId}/hotspots`, {
                params: { days, grid_size: gridSize }
            })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch hotspots'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Phase 3: All in one ───────────────────────────────────
    async function fetchPhase3(farmId, days = 30) {
        loading.value = true
        try {
            const response = await api.get(`/satellite/farms/${farmId}/phase3`, { params: { days } })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch Phase 3 data'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Helpers ───────────────────────────────────────────────
    function getNDVI(farmId)    { return ndviData.value[farmId]    || null }
    function getIndices(farmId) { return indicesData.value[farmId] || null }
    function getHistory(farmId) { return historyData.value[farmId] || null }

    return {
        ndviData, indicesData, historyData, coverage,
        loading, refreshing, error,
        fetchNDVI, fetchIndices, refreshFarmData, fetchHistory, fetchCoverage,
        fetchZonalStats, fetchChangeDetection, fetchHotspots, fetchPhase3,
        getNDVI, getIndices, getHistory,
    }
})