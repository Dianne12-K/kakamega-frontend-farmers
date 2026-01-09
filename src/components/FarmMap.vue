<template>
  <div class="farm-map-page">
    <!-- Top Controls -->
    <div class="map-controls p-4 bg-white shadow-md">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
                v-model="searchQuery"
                placeholder="Search farms, owners, locations..."
                class="w-full"
            />
          </span>
        </div>

        <!-- Region Filter -->
        <Select
            v-model="selectedRegion"
            :options="regions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Regions"
            class="w-48"
        />

        <!-- Health Filter -->
        <Select
            v-model="selectedHealth"
            :options="healthFilters"
            optionLabel="label"
            optionValue="value"
            placeholder="All Farms"
            class="w-48"
        />

        <!-- Reset Button -->
        <Button
            icon="pi pi-filter-slash"
            label="Reset"
            severity="secondary"
            outlined
            @click="resetFilters"
        />

        <!-- Add Farm Button -->
        <Button
            icon="pi pi-plus"
            label="Add Farm"
            @click="router.push('/farms/add')"
        />
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div class="text-xs text-gray-600 mb-1">Total Farms</div>
          <div class="text-2xl font-bold text-gray-800">{{ mapStats.total }}</div>
        </div>
        <div class="bg-green-50 p-3 rounded-lg border border-green-200">
          <div class="text-xs text-green-700 mb-1">Excellent</div>
          <div class="text-2xl font-bold text-green-800">{{ mapStats.excellent }}</div>
        </div>
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div class="text-xs text-blue-700 mb-1">Good</div>
          <div class="text-2xl font-bold text-blue-800">{{ mapStats.good }}</div>
        </div>
        <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div class="text-xs text-orange-700 mb-1">Fair</div>
          <div class="text-2xl font-bold text-orange-800">{{ mapStats.fair }}</div>
        </div>
        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
          <div class="text-xs text-red-700 mb-1">Poor</div>
          <div class="text-2xl font-bold text-red-800">{{ mapStats.poor }}</div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-wrapper">
      <div ref="mapContainer" class="map-container"></div>

      <!-- Popup -->
      <div ref="popupContainer" class="ol-popup" v-show="popupContent">
        <div class="popup-content bg-white rounded-lg shadow-xl p-4">
          <button
              @click="closePopup"
              class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
          >
            <i class="pi pi-times"></i>
          </button>

          <div v-if="popupContent">
            <h3 class="font-bold text-lg text-gray-900 mb-3">{{ popupContent.name }}</h3>

            <div class="space-y-2 text-sm mb-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Owner:</span>
                <span class="font-semibold">{{ popupContent.owner }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Crop:</span>
                <span class="font-semibold capitalize">{{ popupContent.crop_type || popupContent.cropType }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Area:</span>
                <span class="font-semibold">{{ (popupContent.area_ha || popupContent.size)?.toFixed(1) }} ha</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Health:</span>
                <span
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                    :class="getHealthClass(popupContent.current_health?.score || popupContent.health)"
                >
                  {{ popupContent.current_health?.score || popupContent.health || 0 }}/100
                </span>
              </div>
            </div>

            <button
                @click="viewFarmDetails(popupContent.id)"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <Card>
          <template #content>
            <h3 class="text-sm font-bold text-gray-800 mb-3">Farm Health</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" style="background: rgba(34, 197, 94, 0.6);"></div>
                <span class="text-xs text-gray-700">Excellent (80-100)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" style="background: rgba(59, 130, 246, 0.6);"></div>
                <span class="text-xs text-gray-700">Good (60-79)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" style="background: rgba(245, 158, 11, 0.6);"></div>
                <span class="text-xs text-gray-700">Fair (40-59)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" style="background: rgba(239, 68, 68, 0.6);"></div>
                <span class="text-xs text-gray-700">Poor (0-39)</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Farm List Toggle -->
      <div class="farm-list-toggle">
        <Button
            icon="pi pi-list"
            label="Farm List"
            severity="info"
            @click="showSidebar = true"
        />
      </div>
    </div>

    <!-- Sidebar with Farm List -->
    <Drawer v-model:visible="showSidebar" position="right" class="w-full md:w-[400px]">
      <template #header>
        <h2 class="text-xl font-bold text-gray-800">
          {{ selectedFarm ? selectedFarm.name : 'All Farms' }}
        </h2>
      </template>

      <!-- Selected Farm Details -->
      <div v-if="selectedFarm" class="mb-4">
        <Card>
          <template #content>
            <div class="space-y-3">
              <div>
                <h3 class="text-lg font-bold text-gray-800">{{ selectedFarm.name }}</h3>
                <p class="text-gray-600">{{ selectedFarm.owner }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-xs text-gray-600">Health Score</span>
                  <Tag
                      :value="`${selectedFarm.current_health?.score || selectedFarm.health || 0}%`"
                      :severity="getHealthSeverity(selectedFarm.current_health?.score || selectedFarm.health)"
                      class="mt-1"
                  />
                </div>
                <div>
                  <span class="text-xs text-gray-600">Crop Type</span>
                  <p class="text-sm font-medium text-gray-800">{{ selectedFarm.crop_type || selectedFarm.cropType || 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-600">Size</span>
                  <p class="text-sm font-medium text-gray-800">{{ (selectedFarm.area_ha || selectedFarm.size)?.toFixed(1) }} ha</p>
                </div>
                <div>
                  <span class="text-xs text-gray-600">Location</span>
                  <p class="text-sm font-medium text-gray-800">{{ selectedFarm.subCounty || 'N/A' }}</p>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <Button
                    label="View Details"
                    icon="pi pi-eye"
                    class="flex-1"
                    @click="viewFarmDetails(selectedFarm.id)"
                />
                <Button
                    label="Center"
                    icon="pi pi-map-marker"
                    severity="secondary"
                    outlined
                    @click="centerOnFarm(selectedFarm)"
                />
              </div>
            </div>
          </template>
        </Card>

        <Button
            label="Clear Selection"
            icon="pi pi-times"
            severity="secondary"
            text
            class="w-full mt-3"
            @click="selectedFarm = null"
        />
      </div>

      <!-- Farm List -->
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">
            {{ filteredFarms.length }} Farm{{ filteredFarms.length !== 1 ? 's' : '' }}
          </h3>
        </div>

        <div
            v-for="farm in filteredFarms"
            :key="farm.id"
            class="farm-list-item p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
            @click="selectFarm(farm)"
        >
          <div class="flex items-start gap-3">
            <div
                class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                :style="{ background: getMarkerColor(farm.current_health?.score || farm.health) }"
            ></div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-800 truncate">{{ farm.name }}</h4>
              <p class="text-sm text-gray-600 truncate">{{ farm.owner }}</p>
              <div class="flex items-center gap-2 mt-1">
                <Tag
                    :value="`${farm.current_health?.score || farm.health || 0}%`"
                    :severity="getHealthSeverity(farm.current_health?.score || farm.health)"
                    size="small"
                />
                <span class="text-xs text-gray-500">{{ farm.subCounty }}</span>
              </div>
            </div>
            <Button
                icon="pi pi-map-marker"
                text
                rounded
                size="small"
                @click.stop="centerOnFarm(farm)"
            />
          </div>
        </div>

        <div v-if="filteredFarms.length === 0" class="text-center py-8">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-600">No farms found</p>
          <Button
              label="Reset Filters"
              icon="pi pi-filter-slash"
              text
              class="mt-3"
              @click="resetFilters"
          />
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms.js'
import { useAlertsStore } from '@/stores/alerts.js'

import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'
import { Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle } from 'ol/style'
import Overlay from 'ol/Overlay'
import { defaults as defaultControls } from 'ol/control'

import 'ol/ol.css'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Drawer from 'primevue/drawer'
import Tag from 'primevue/tag'

const router = useRouter()
const farmsStore = useFarmsStore()
const alertsStore = useAlertsStore()

// Map refs
const mapContainer = ref(null)
const popupContainer = ref(null)
const map = ref(null)
const vectorSource = ref(null)
const overlay = ref(null)
const popupContent = ref(null)
const hoveredFarm = ref(null)

// Filters
const searchQuery = ref('')
const selectedRegion = ref('all')
const selectedHealth = ref('all')
const showSidebar = ref(false)
const selectedFarm = ref(null)

// Regions & Health Options
const regions = [
  { label: 'All Regions', value: 'all' },
  { label: 'Malava', value: 'malava' },
  { label: 'Lugari', value: 'lugari' },
  { label: 'Likuyani', value: 'likuyani' },
  { label: 'Mumias', value: 'mumias' },
  { label: 'Matungu', value: 'matungu' }
]

const healthFilters = [
  { label: 'All Farms', value: 'all' },
  { label: 'Excellent (80+)', value: 'excellent' },
  { label: 'Good (60-79)', value: 'good' },
  { label: 'Fair (40-59)', value: 'fair' },
  { label: 'Poor (<40)', value: 'poor' }
]

// Kakamega center
const CENTER = [34.7519, 0.2827]

// Filtered Farms
const filteredFarms = computed(() => {
  let farms = farmsStore.farms

  if (selectedRegion.value !== 'all') {
    farms = farms.filter(f => f.subCounty === selectedRegion.value)
  }

  if (selectedHealth.value !== 'all') {
    farms = farms.filter(f => {
      const health = f.current_health?.score || f.health || 0
      if (selectedHealth.value === 'excellent') return health >= 80
      if (selectedHealth.value === 'good') return health >= 60 && health < 80
      if (selectedHealth.value === 'fair') return health >= 40 && health < 60
      if (selectedHealth.value === 'poor') return health < 40
      return true
    })
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    farms = farms.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.owner.toLowerCase().includes(q) ||
        f.location?.toLowerCase().includes(q)
    )
  }

  return farms
})

// Map Stats
const mapStats = computed(() => {
  const farms = filteredFarms.value
  return {
    total: farms.length,
    excellent: farms.filter(f => (f.current_health?.score || f.health || 0) >= 80).length,
    good: farms.filter(f => {
      const h = f.current_health?.score || f.health || 0
      return h >= 60 && h < 80
    }).length,
    fair: farms.filter(f => {
      const h = f.current_health?.score || f.health || 0
      return h >= 40 && h < 60
    }).length,
    poor: farms.filter(f => (f.current_health?.score || f.health || 0) < 40).length
  }
})

// Style functions
const getFarmStyle = (farm, isSelected = false, isHovered = false) => {
  const healthScore = farm.current_health?.score || farm.health || 50

  let fillColor, strokeColor
  if (healthScore >= 80) {
    fillColor = 'rgba(34, 197, 94, 0.4)'
    strokeColor = 'rgba(34, 197, 94, 1)'
  } else if (healthScore >= 60) {
    fillColor = 'rgba(59, 130, 246, 0.4)'
    strokeColor = 'rgba(59, 130, 246, 1)'
  } else if (healthScore >= 40) {
    fillColor = 'rgba(245, 158, 11, 0.4)'
    strokeColor = 'rgba(245, 158, 11, 1)'
  } else {
    fillColor = 'rgba(239, 68, 68, 0.4)'
    strokeColor = 'rgba(239, 68, 68, 1)'
  }

  if (isSelected) {
    fillColor = 'rgba(99, 102, 241, 0.5)'
    strokeColor = 'rgba(99, 102, 241, 1)'
  } else if (isHovered) {
    fillColor = fillColor.replace('0.4', '0.6')
  }

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({
      color: strokeColor,
      width: isSelected ? 3 : isHovered ? 2.5 : 2
    }),
    text: new TextStyle({
      text: farm.name,
      font: 'bold 12px sans-serif',
      fill: new Fill({ color: '#1f2937' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      offsetY: 0
    })
  })
}

const getPointStyle = (farm, isSelected = false) => {
  const healthScore = farm.current_health?.score || farm.health || 50

  let fillColor
  if (healthScore >= 80) fillColor = 'rgba(34, 197, 94, 1)'
  else if (healthScore >= 60) fillColor = 'rgba(59, 130, 246, 1)'
  else if (healthScore >= 40) fillColor = 'rgba(245, 158, 11, 1)'
  else fillColor = 'rgba(239, 68, 68, 1)'

  return new Style({
    image: new CircleStyle({
      radius: isSelected ? 10 : 7,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    }),
    text: new TextStyle({
      text: farm.name,
      font: 'bold 11px sans-serif',
      fill: new Fill({ color: '#1f2937' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      offsetY: -15
    })
  })
}

const initMap = () => {
  vectorSource.value = new VectorSource()

  overlay.value = new Overlay({
    element: popupContainer.value,
    autoPan: { animation: { duration: 250 } },
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -10]
  })

  map.value = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({
        source: vectorSource.value,
        style: (feature) => {
          const farm = feature.get('farm')
          const isSelected = selectedFarm.value?.id === farm.id
          const isHovered = hoveredFarm.value?.id === farm.id

          if (feature.getGeometry().getType() === 'Polygon') {
            return getFarmStyle(farm, isSelected, isHovered)
          } else {
            return getPointStyle(farm, isSelected)
          }
        }
      })
    ],
    overlays: [overlay.value],
    view: new View({
      center: fromLonLat(CENTER),
      zoom: 11
    }),
    controls: defaultControls({ attribution: false, zoom: true })
  })

  map.value.on('click', (evt) => {
    const feature = map.value.forEachFeatureAtPixel(evt.pixel, (f) => f)
    if (feature) {
      const farm = feature.get('farm')
      selectedFarm.value = farm
      showPopup(evt.coordinate, farm)
    } else {
      closePopup()
    }
  })

  map.value.on('pointermove', (evt) => {
    const feature = map.value.forEachFeatureAtPixel(evt.pixel, (f) => f)
    if (feature) {
      hoveredFarm.value = feature.get('farm')
      map.value.getTargetElement().style.cursor = 'pointer'
    } else {
      hoveredFarm.value = null
      map.value.getTargetElement().style.cursor = ''
    }
    vectorSource.value.changed()
  })

  loadFarms()
}

const loadFarms = () => {
  if (!vectorSource.value) return

  vectorSource.value.clear()

  filteredFarms.value.forEach(farm => {
    let feature

    // Check for polygon data
    if (farm.boundary_geojson && farm.boundary_geojson.coordinates) {
      const coordinates = farm.boundary_geojson.coordinates[0].map(coord =>
          fromLonLat([coord[0], coord[1]])
      )
      feature = new Feature({
        geometry: new Polygon([coordinates]),
        farm: farm
      })
    } else if (farm.latitude && farm.longitude) {
      feature = new Feature({
        geometry: new Point(fromLonLat([farm.longitude, farm.latitude])),
        farm: farm
      })
    } else {
      return
    }

    vectorSource.value.addFeature(feature)
  })

  if (vectorSource.value.getFeatures().length > 0) {
    const extent = vectorSource.value.getExtent()
    map.value.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 })
  }
}

const showPopup = (coordinate, farm) => {
  popupContent.value = farm
  overlay.value.setPosition(coordinate)
}

const closePopup = () => {
  overlay.value.setPosition(undefined)
  popupContent.value = null
}

// Helpers
const getMarkerColor = health => {
  if (health >= 80) return '#22c55e'
  if (health >= 60) return '#3b82f6'
  if (health >= 40) return '#f59e0b'
  return '#ef4444'
}

const getHealthSeverity = health => {
  if (health >= 80) return 'success'
  if (health >= 60) return 'info'
  if (health >= 40) return 'warn'
  return 'danger'
}

const getHealthClass = (health) => {
  if (health >= 80) return 'bg-green-100 text-green-800'
  if (health >= 60) return 'bg-blue-100 text-blue-800'
  if (health >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const selectFarm = farm => {
  selectedFarm.value = farm
  centerOnFarm(farm)
}

const viewFarmDetails = farmId => {
  router.push(`/farms/${farmId}`)
}

const centerOnFarm = farm => {
  if (!map.value) return

  const features = vectorSource.value.getFeatures()
  const feature = features.find(f => f.get('farm').id === farm.id)

  if (feature) {
    const geometry = feature.getGeometry()
    const extent = geometry.getExtent()
    map.value.getView().fit(extent, {
      padding: [100, 100, 100, 100],
      maxZoom: 16,
      duration: 500
    })

    const center = geometry.getType() === 'Polygon'
        ? geometry.getInteriorPoint().getCoordinates()
        : geometry.getCoordinates()
    showPopup(center, farm)
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedRegion.value = 'all'
  selectedHealth.value = 'all'
}

watch(() => farmsStore.farms, farms => {
  if (farms?.length) alertsStore.generateAlerts(farms)
}, { immediate: true })

watch([selectedRegion, selectedHealth, searchQuery], () => {
  if (map.value) loadFarms()
})

watch(() => selectedFarm.value, (newFarm) => {
  if (newFarm && map.value) {
    centerOnFarm(newFarm)
  }
  vectorSource.value?.changed()
})

onMounted(async () => {
  await farmsStore.fetchFarms()
  nextTick(() => {
    initMap()
  })
})
</script>

<style scoped>
.farm-map-page { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.map-controls { flex-shrink: 0; z-index: 1000; }
.map-wrapper { flex: 1; position: relative; overflow: hidden; }
.map-container { width: 100%; height: 100%; }
.map-legend { position: absolute; bottom: 20px; left: 20px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.farm-list-toggle { position: absolute; top: 20px; right: 20px; z-index: 1000; }
.farm-list-item { transition: all 0.2s; }
.farm-list-item:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  border-radius: 10px;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}

.popup-content {
  position: relative;
}

@media (max-width: 768px) {
  .map-legend { bottom: 10px; left: 10px; font-size: 0.875rem; }
  .farm-list-toggle { top: 10px; right: 10px; }
}
</style>