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

    // ── Helpers ───────────────────────────────────────────────
    function getNDVI(farmId)    { return ndviData.value[farmId]    || null }
    function getIndices(farmId) { return indicesData.value[farmId] || null }
    function getHistory(farmId) { return historyData.value[farmId] || null }

    return {
        ndviData, indicesData, historyData, coverage,
        loading, refreshing, error,
        fetchNDVI, fetchIndices, refreshFarmData, fetchHistory, fetchCoverage,
        getNDVI, getIndices, getHistory,
    }
})