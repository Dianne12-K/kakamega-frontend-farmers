// stores/ml.js
// Pinia store for all ML prediction data

import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useMLStore = defineStore('ml', () => {

    // ── State ────────────────────────────────────────────────
    const modelStatus    = ref(null)
    const predictions    = ref({})   // keyed by farm_id
    const landCoverResult= ref(null)
    const loading        = ref(false)
    const error          = ref(null)

    // ── Model Status ─────────────────────────────────────────
    async function fetchModelStatus() {
        try {
            const res = await api.get('/ml/status')
            modelStatus.value = res.data.models
            return res.data.models
        } catch (e) {
            error.value = e.message
        }
    }

    // ── All predictions for one farm ─────────────────────────
    async function fetchFarmPredictions(farmId) {
        loading.value = true
        error.value   = null
        try {
            const res = await api.get(`/ml/farm/${farmId}/all`)
            predictions.value[farmId] = res.data.data
            return res.data.data
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    // ── Individual model calls ────────────────────────────────
    async function fetchYieldPrediction(farmId) {
        try {
            const res = await api.get(`/ml/yield/${farmId}`)
            if (!predictions.value[farmId]) predictions.value[farmId] = {}
            predictions.value[farmId].yield = res.data.data
            return res.data.data
        } catch (e) {
            error.value = e.message
            return null
        }
    }

    async function fetchPestRisk(farmId) {
        try {
            const res = await api.get(`/ml/pest-risk/${farmId}`)
            if (!predictions.value[farmId]) predictions.value[farmId] = {}
            predictions.value[farmId].pest_risk = res.data.data
            return res.data.data
        } catch (e) {
            error.value = e.message
            return null
        }
    }

    async function fetchHealthForecast(farmId) {
        try {
            const res = await api.get(`/ml/health-forecast/${farmId}`)
            if (!predictions.value[farmId]) predictions.value[farmId] = {}
            predictions.value[farmId].health_forecast = res.data.data
            return res.data.data
        } catch (e) {
            error.value = e.message
            return null
        }
    }

    async function classifyLandCover(spectralPayload) {
        loading.value = true
        error.value   = null
        try {
            const res = await api.post('/ml/land-cover', spectralPayload)
            landCoverResult.value = res.data.data
            return res.data.data
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    async function retrainModels() {
        loading.value = true
        try {
            const res = await api.post('/ml/retrain')
            await fetchModelStatus()
            return res.data.metrics
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    // ── Getters ───────────────────────────────────────────────
    function getFarmPredictions(farmId) {
        return predictions.value[farmId] || null
    }

    return {
        modelStatus,
        predictions,
        landCoverResult,
        loading,
        error,

        fetchModelStatus,
        fetchFarmPredictions,
        fetchYieldPrediction,
        fetchPestRisk,
        fetchHealthForecast,
        classifyLandCover,
        retrainModels,
        getFarmPredictions,
    }
})