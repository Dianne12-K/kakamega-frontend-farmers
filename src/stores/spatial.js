// src/stores/spatial.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useSpatialStore = defineStore('spatial', () => {
    const mapOverview      = ref(null)   // all layers: farms, markets, subcounties
    const nearbyFarms      = ref([])
    const nearbyMarkets    = ref([])
    const subcountyFarms   = ref([])     // farms inside a specific subcounty
    const loading          = ref(false)
    const error            = ref(null)

    // ── Full Map Overview (loads all layers at once for Leaflet) ──
    async function fetchMapOverview() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/spatial/overview')
            mapOverview.value = response.data.layers
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch map overview'
            console.error('Map overview error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Farms Within X km of a Point ──────────────────────────
    async function fetchNearbyFarms(lat, lon, km = 10, cropType = null) {
        loading.value = true
        error.value = null
        try {
            const params = { lat, lon, km }
            if (cropType) params.crop_type = cropType
            const response = await api.get('/spatial/farms/nearby', { params })
            nearbyFarms.value = response.data.farms || []
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch nearby farms'
            console.error('Nearby farms error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Farms Inside a Subcounty Boundary ─────────────────────
    async function fetchFarmsInSubcounty(subcountyId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/spatial/farms/within-subcounty/${subcountyId}`)
            subcountyFarms.value = response.data.farms || []
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch subcounty farms'
            console.error('Subcounty farms error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // ── Nearest Markets & Collection Centers ──────────────────
    async function fetchNearbyMarkets(lat, lon, km = 25, type = 'all') {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/spatial/markets/nearby', {
                params: { lat, lon, km, type }
            })
            nearbyMarkets.value = [
                ...(response.data.markets || []),
                ...(response.data.collection_centers || [])
            ]
            return response.data
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch nearby markets'
            console.error('Nearby markets error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    function clearNearby() {
        nearbyFarms.value  = []
        nearbyMarkets.value = []
    }

    return {
        mapOverview, nearbyFarms, nearbyMarkets, subcountyFarms,
        loading, error,
        fetchMapOverview, fetchNearbyFarms, fetchFarmsInSubcounty,
        fetchNearbyMarkets, clearNearby,
    }
})