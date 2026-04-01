// src/stores/layers.js
import { defineStore } from 'pinia'
import { ref }         from 'vue'
import api             from '@/services/api'

export const useLayersStore = defineStore('layers', () => {
    const layers  = ref([])
    const loading = ref(false)
    const error   = ref(null)

    async function fetchLayers() {
        loading.value = true
        error.value   = null
        try {
            const res = await api.get('/layers/')
            layers.value = res.data.layers ?? []
            return layers.value
        } catch (e) {
            error.value = e.response?.data?.error || 'Failed to fetch layers'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function uploadLayer(formData) {
        loading.value = true
        error.value   = null
        try {
            const res = await api.post('/layers/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            await fetchLayers()
            return res.data
        } catch (e) {
            error.value = e.response?.data?.error || 'Upload failed'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateLayer(layerId, payload) {
        try {
            const res = await api.patch(`/layers/${layerId}`, payload)
            const idx = layers.value.findIndex(l => l.id === layerId)
            if (idx !== -1) layers.value[idx] = res.data.layer
            return res.data.layer
        } catch (e) {
            error.value = e.response?.data?.error || 'Update failed'
            throw e
        }
    }

    async function deleteLayer(layerId) {
        try {
            await api.delete(`/layers/${layerId}`)
            layers.value = layers.value.filter(l => l.id !== layerId)
        } catch (e) {
            error.value = e.response?.data?.error || 'Delete failed'
            throw e
        }
    }

    async function fetchLayerGeoJSON(layerId) {
        const res = await api.get(`/layers/${layerId}/geojson`)
        return res.data
    }

    function toggleVisible(layerId) {
        const layer = layers.value.find(l => l.id === layerId)
        if (!layer) return
        updateLayer(layerId, { visible: !layer.visible })
    }

    return {
        layers, loading, error,
        fetchLayers, uploadLayer, updateLayer,
        deleteLayer, fetchLayerGeoJSON, toggleVisible,
    }
})