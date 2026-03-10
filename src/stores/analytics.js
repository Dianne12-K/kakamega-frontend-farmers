// src/stores/analytics.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAnalyticsStore = defineStore('analytics', () => {
    const platformKPIs      = ref(null)   // /api/analytics/platform/overview
    const farmSummary       = ref(null)   // /api/analytics/farms/summary
    const healthOverview    = ref(null)   // /api/analytics/farms/health-overview
    const priceTrends       = ref({})     // keyed by crop_type
    const subcountyStats    = ref({})     // keyed by subcounty_id
    const loading           = ref(false)
    const error             = ref(null)

    // ── Platform KPI Cards (Dashboard top row) ───────────────
    async function fetchPlatformKPIs() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/analytics/platform/overview')
            platformKPIs.value = response.data.kpis
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch platform KPIs'
            console.error('Platform KPIs error:', err)
        } finally {
            loading.value = false
        }
    }

    // ── Farm Portfolio Summary (crop breakdown, area) ─────────
    async function fetchFarmSummary() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/analytics/farms/summary')
            farmSummary.value = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch farm summary'
            console.error('Farm summary error:', err)
        } finally {
            loading.value = false
        }
    }

    // ── Health Overview (healthy vs watch vs critical %) ──────
    async function fetchHealthOverview() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/analytics/farms/health-overview')
            healthOverview.value = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch health overview'
            console.error('Health overview error:', err)
        } finally {
            loading.value = false
        }
    }

    // ── Price Trends for a Crop ───────────────────────────────
    async function fetchPriceTrends(cropType, days = 90) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/analytics/markets/price-trends/${cropType}`, {
                params: { days }
            })
            priceTrends.value[cropType] = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch price trends'
            console.error('Price trends error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Per-Subcounty Stats ───────────────────────────────────
    async function fetchSubcountyStats(subcountyId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/analytics/subcounty/${subcountyId}/stats`)
            subcountyStats.value[subcountyId] = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch subcounty stats'
            console.error('Subcounty stats error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Convenience: load everything the Dashboard needs ──────
    async function fetchDashboardData() {
        await Promise.allSettled([
            fetchPlatformKPIs(),
            fetchHealthOverview(),
            fetchFarmSummary(),
        ])
    }

    // ── Computed helpers for Dashboard ────────────────────────
    const coveragePercent = computed(() =>
        platformKPIs.value?.monitoring_rate_pct ?? null
    )

    const avgHealthScore = computed(() =>
        platformKPIs.value?.avg_health_score ?? null
    )

    const totalFarms = computed(() =>
        platformKPIs.value?.total_farms ?? null
    )

    const totalAreaHa = computed(() =>
        platformKPIs.value?.total_area_ha ?? null
    )

    return {
        platformKPIs, farmSummary, healthOverview, priceTrends, subcountyStats,
        loading, error,
        coveragePercent, avgHealthScore, totalFarms, totalAreaHa,
        fetchPlatformKPIs, fetchFarmSummary, fetchHealthOverview,
        fetchPriceTrends, fetchSubcountyStats, fetchDashboardData,
    }
})