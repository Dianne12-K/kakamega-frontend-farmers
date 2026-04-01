<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter }      from 'vue-router'
import { useLayersStore } from '@/stores/layers'
import { useSpatialStore } from '@/stores/spatial'
import { useMapStyles }   from '@/composables/useMapStyles'
import { useMapBasemaps } from '@/composables/useMapBasemaps'

import Map          from 'ol/Map'
import View         from 'ol/View'
import VectorLayer  from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON      from 'ol/format/GeoJSON'
import Overlay      from 'ol/Overlay'
import { fromLonLat }             from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import { Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle } from 'ol/style'
import 'ol/ol.css'

import Button    from 'primevue/button'
import InputText from 'primevue/inputtext'

import LayerSidebar    from '@/components/LayerSidebar.vue'
import MapPopup        from '@/composables/map/MapPopup.vue'
import MapLegend       from '@/composables/map/MapLegend.vue'
import BasemapSwitcher from '@/composables/map/BasemapSwitcher.vue'

const router       = useRouter()
const layersStore  = useLayersStore()
const spatialStore = useSpatialStore()
const { getFarmStyle } = useMapStyles()

const mapContainer   = ref(null)
const popupContainer = ref(null)
const mapInstance    = ref(null)
const overlayObj     = ref(null)
const showSidebar    = ref(false)
const activeBasemap  = ref('osm')
const popupFarm      = ref(null)
const hoveredFarmId  = ref(null)
const selectedFarmId = ref(null)
const searchQuery    = ref('')

// One VectorSource per layer — keyed by layer.id
const layerSources = {}
const layerOLLayers = {}

const subcountySource = new VectorSource()
const marketSource    = new VectorSource()
let basemaps = null

const geoJsonFormat = new GeoJSON()

// ── Map init ──────────────────────────────────────────────────
function initMap() {
  overlayObj.value = new Overlay({
    element:     popupContainer.value,
    autoPan:     { animation: { duration: 250 } },
    positioning: 'bottom-center',
    stopEvent:   false,
    offset:      [0, -10],
  })

  const subcountyLayer = new VectorLayer({
    source: subcountySource,
    style: (feat) => new Style({
      fill:   new Fill({ color: 'rgba(99,102,241,0.05)' }),
      stroke: new Stroke({ color: 'rgba(99,102,241,0.5)', width: 1.5, lineDash: [6, 4] }),
      text:   new TextStyle({
        text:   feat.get('name') || '',
        font:   'bold 11px sans-serif',
        fill:   new Fill({ color: 'rgba(99,102,241,0.9)' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    }),
    zIndex: 1,
  })

  const marketLayer = new VectorLayer({
    source: marketSource,
    style: (feat) => new Style({
      image: new CircleStyle({
        radius: 6,
        fill:   new Fill({ color: 'rgba(234,179,8,0.9)' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: new TextStyle({
        text:    feat.get('name') || '',
        font:    '10px sans-serif',
        fill:    new Fill({ color: '#713f12' }),
        stroke:  new Stroke({ color: '#fff', width: 2 }),
        offsetY: -14,
      }),
    }),
    zIndex: 2,
  })

  mapInstance.value = new Map({
    target:   mapContainer.value,
    layers:   [subcountyLayer, marketLayer],
    overlays: [overlayObj.value],
    view:     new View({ center: fromLonLat([34.7519, 0.2827]), zoom: 11 }),
    controls: defaultControls({ attribution: false }),
  })

  basemaps = useMapBasemaps(mapInstance.value, activeBasemap.value)

  // Click
  mapInstance.value.on('click', evt => {
    let clicked = null
    mapInstance.value.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      if (layer?.get('isLayerGroup')) {
        clicked = { feat, layer }
        return true
      }
    })
    if (clicked) {
      const props = clicked.feat.getProperties()
      popupFarm.value    = { ...props, id: props.id }
      selectedFarmId.value = props.id
      const geom = clicked.feat.getGeometry()
      const type = geom.getType()
      const pos  = (type === 'Polygon' || type === 'MultiPolygon')
          ? (geom.getInteriorPoint?.()?.getCoordinates() ?? evt.coordinate)
          : evt.coordinate
      overlayObj.value.setPosition(pos)
      refreshLayerStyles()
    } else {
      closePopup()
    }
  })

  // Hover
  mapInstance.value.on('pointermove', evt => {
    let hovered = null
    mapInstance.value.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      if (layer?.get('isLayerGroup')) {
        hovered = feat.get('id')
        return true
      }
    })
    if (hovered !== hoveredFarmId.value) {
      hoveredFarmId.value = hovered
      refreshLayerStyles()
    }
    mapInstance.value.getTargetElement().style.cursor = hovered ? 'pointer' : ''
  })
}

// ── Style function for a farm feature ─────────────────────────
function makeFarmStyle(feat, layerColor) {
  const id       = feat.get('id')
  const selected = selectedFarmId.value === id
  const hovered  = hoveredFarmId.value  === id
  const score    = feat.get('current_health')?.score ?? 50

  if (selected) {
    return new Style({
      fill:   new Fill({ color: 'rgba(99,102,241,0.40)' }),
      stroke: new Stroke({ color: '#6366f1', width: 3 }),
      text:   new TextStyle({
        text:   feat.get('name') || '',
        font:   'bold 12px sans-serif',
        fill:   new Fill({ color: '#1f2937' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    })
  }
  if (hovered) {
    return new Style({
      fill:   new Fill({ color: hexToRgba(layerColor, 0.35) }),
      stroke: new Stroke({ color: layerColor, width: 2.5 }),
      text:   new TextStyle({
        text:   feat.get('name') || '',
        font:   '11px sans-serif',
        fill:   new Fill({ color: '#1f2937' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    })
  }
  return new Style({
    fill:   new Fill({ color: hexToRgba(layerColor, 0.12) }),
    stroke: new Stroke({ color: layerColor, width: 1.8 }),
  })
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

function refreshLayerStyles() {
  Object.values(layerSources).forEach(({ source }) => source.changed())
}

// ── Load / refresh all layer polygons ─────────────────────────
async function loadLayers() {
  const layers = layersStore.layers
  const allExtents = []

  for (const layer of layers) {
    // Create OL layer if it doesn't exist yet
    if (!layerSources[layer.id]) {
      const source   = new VectorSource()
      const color    = layer.color || '#3b82f6'
      const olLayer  = new VectorLayer({
        source,
        style: feat => makeFarmStyle(feat, color),
        zIndex: 10,
      })
      olLayer.set('isLayerGroup', true)
      olLayer.set('layerId', layer.id)
      layerSources[layer.id]  = { source, color }
      layerOLLayers[layer.id] = olLayer
      mapInstance.value?.addLayer(olLayer)
    }

    // Toggle visibility
    layerOLLayers[layer.id]?.setVisible(layer.visible)

    if (!layer.visible) continue

    // Fetch GeoJSON for this layer
    try {
      const data     = await layersStore.fetchLayerGeoJSON(layer.id)
      const features = geoJsonFormat.readFeatures(data, { featureProjection: 'EPSG:3857' })
      layerSources[layer.id].source.clear()
      layerSources[layer.id].source.addFeatures(features)

      if (features.length) {
        const src = layerSources[layer.id].source
        allExtents.push(src.getExtent())
      }
    } catch (e) {
      console.warn(`Failed to load GeoJSON for layer ${layer.id}:`, e)
    }
  }

  // Remove OL layers that no longer exist in store
  const activeIds = new Set(layers.map(l => l.id))
  for (const id of Object.keys(layerSources)) {
    if (!activeIds.has(parseInt(id))) {
      mapInstance.value?.removeLayer(layerOLLayers[id])
      delete layerSources[id]
      delete layerOLLayers[id]
    }
  }

  // Fit view to all farm extents
  if (allExtents.length) {
    const combined = allExtents.reduce((acc, ext) => [
      Math.min(acc[0], ext[0]), Math.min(acc[1], ext[1]),
      Math.max(acc[2], ext[2]), Math.max(acc[3], ext[3]),
    ])
    mapInstance.value?.getView().fit(combined, { padding: [60,60,60,60], maxZoom: 16 })
  }
}

// ── Load subcounties + markets ─────────────────────────────────
async function loadBaseLayers() {
  try {
    const data = await spatialStore.fetchMapOverview()
    if (data.layers?.subcounties?.features?.length) {
      subcountySource.clear()
      subcountySource.addFeatures(
          geoJsonFormat.readFeatures(data.layers.subcounties, { featureProjection: 'EPSG:3857' })
      )
    }
    if (data.layers?.markets?.features?.length) {
      marketSource.clear()
      marketSource.addFeatures(
          geoJsonFormat.readFeatures(data.layers.markets, { featureProjection: 'EPSG:3857' })
      )
    }
  } catch (e) {
    console.warn('Base layers failed:', e)
  }
}

function closePopup() {
  overlayObj.value?.setPosition(undefined)
  popupFarm.value    = null
  selectedFarmId.value = null
  refreshLayerStyles()
}

async function onLayersChanged() {
  await layersStore.fetchLayers()
  await loadLayers()
}

watch(activeBasemap, id => basemaps?.switchBasemap(id))

onMounted(async () => {
  await layersStore.fetchLayers()
  nextTick(async () => {
    initMap()
    await loadBaseLayers()
    await loadLayers()
  })
})
</script>

<template>
  <div class="farms-map-page">

    <!-- Top bar -->
    <div class="farms-topbar">
      <div class="flex items-center gap-3">
        <Button
            icon="pi pi-bars"
            severity="secondary"
            outlined
            size="small"
            label="Layers"
            @click="showSidebar = !showSidebar"
            :badge="layersStore.layers.length ? String(layersStore.layers.length) : undefined"
        />
        <span class="text-sm text-gray-500">
                    {{ layersStore.layers.reduce((s,l) => s + l.farm_count, 0) }} parcels across
                    {{ layersStore.layers.length }} layer{{ layersStore.layers.length !== 1 ? 's' : '' }}
                </span>
      </div>
      <div class="flex items-center gap-2">
                <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText
                        v-model="searchQuery"
                        placeholder="Search parcels..."
                        size="small"
                        class="w-52"
                    />
                </span>
        <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="layersStore.loading"
            @click="onLayersChanged"
        />
      </div>
    </div>

    <!-- Map wrapper -->
    <div class="farms-map-wrapper">
      <div ref="mapContainer" class="map-canvas"></div>

      <!-- Popup -->
      <div ref="popupContainer" class="ol-popup">
        <MapPopup
            :farm="popupFarm"
            @close="closePopup"
            @view="router.push(`/farms/${$event}`)"
        />
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <MapLegend />
      </div>

      <!-- Basemap switcher -->
      <div class="map-basemap">
        <BasemapSwitcher v-model="activeBasemap" />
      </div>

      <!-- Empty state -->
      <div v-if="!layersStore.loading && !layersStore.layers.length" class="map-empty">
        <div class="map-empty-card">
          <i class="pi pi-map text-4xl text-gray-300 block mb-3"></i>
          <p class="font-semibold text-gray-600">No layers yet</p>
          <p class="text-sm text-gray-400 mt-1">
            Open the Layers panel and upload a boundary file to get started.
          </p>
          <button
              class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold
                               rounded-lg hover:bg-blue-700 transition-colors"
              @click="showSidebar = true"
          >
            Open Layers Panel
          </button>
        </div>
      </div>

      <!-- Loading overlay -->
      <div v-if="layersStore.loading" class="map-loading">
        <i class="pi pi-spin pi-spinner text-2xl text-white"></i>
      </div>
    </div>

    <!-- Layer sidebar (PrimeVue Drawer) -->
    <LayerSidebar
        v-model:visible="showSidebar"
        @layers-changed="onLayersChanged"
    />

  </div>
</template>

<style scoped>
.farms-map-page {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.farms-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #f3f4f6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  z-index: 100;
}

.farms-map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-canvas { width: 100%; height: 100%; }

.ol-popup { position: absolute; bottom: 12px; left: -50px; }

.map-legend  { position: absolute; bottom: 20px; left: 16px; z-index: 1000; }
.map-basemap {
  position: absolute; bottom: 20px;
  left: 50%; transform: translateX(-50%);
  z-index: 1000;
}

.map-empty {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.map-empty-card {
  background: white;
  border-radius: 16px;
  padding: 32px 40px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  pointer-events: all;
}

.map-loading {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.20);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
</style>