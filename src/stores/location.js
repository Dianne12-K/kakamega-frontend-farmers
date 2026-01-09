// src/stores/locations.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useLocationsStore = defineStore('locations', () => {
    const subCounties = ref([])
    const wards = ref([])
    const loading = ref(false)
    const error = ref(null)

    /* =====================
     * SUB-COUNTIES
     * ===================== */
    async function fetchSubCounties() {
        loading.value = true
        error.value = null
        try {
            const response = await api.get('/subcounties')
            console.log('Full API Response:', response)
            console.log('Response data:', response.data)
            console.log('Response data type:', typeof response.data)
            console.log('Response data keys:', Object.keys(response.data))

            // The data might be nested differently
            let data = response.data

            // Check if data is wrapped in another property
            if (data.subcounties) {
                data = data.subcounties
            } else if (data.data) {
                data = data.data
            } else if (!Array.isArray(data)) {
                // If it's an object, try to extract array
                data = Object.values(data)
            }

            subCounties.value = Array.isArray(data) ? data : []
            console.log('Processed sub-counties:', subCounties.value)

            return subCounties.value
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch sub-counties'
            console.error('Fetch sub-counties error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchSubCountyById(subCountyId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/subcounties/${subCountyId}`)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch sub-county'
            console.error('Fetch sub-county error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /* =====================
     * WARDS
     * ===================== */
    async function fetchWards(subCountyId = null) {
        loading.value = true
        error.value = null
        try {
            const params = subCountyId ? { subcounty_id: subCountyId } : {}
            const response = await api.get('/wards', { params })
            wards.value = response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch wards'
            console.error('Fetch wards error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchWardsBySubCounty(subCountyId) {
        loading.value = true
        error.value = null
        try {
            console.log('Store: Fetching wards for subcounty:', subCountyId)
            const response = await api.get(`/subcounties/${subCountyId}/wards`)
            console.log('Store: Full wards response:', response)
            console.log('Store: Response data:', response.data)
            console.log('Store: Response data type:', typeof response.data)
            console.log('Store: Response data keys:', Object.keys(response.data))

            // The data might be nested differently
            let data = response.data

            // Check if data is wrapped in another property
            if (data.wards) {
                data = data.wards
            } else if (data.data) {
                data = data.data
            } else if (!Array.isArray(data)) {
                // If it's an object, try to extract array
                data = Object.values(data)
            }

            wards.value = Array.isArray(data) ? data : []
            console.log('Store: Processed wards:', wards.value)

            return wards.value
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch wards'
            console.error('Store: Fetch wards error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchWardById(wardId) {
        loading.value = true
        error.value = null
        try {
            const response = await api.get(`/wards/${wardId}`)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch ward'
            console.error('Fetch ward error:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        subCounties,
        wards,
        loading,
        error,

        // Actions
        fetchSubCounties,
        fetchSubCountyById,
        fetchWards,
        fetchWardsBySubCounty,
        fetchWardById
    }
})