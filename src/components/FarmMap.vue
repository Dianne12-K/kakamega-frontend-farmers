<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore }   from '@/stores/farms.js'
import { useAlertsStore }  from '@/stores/alerts.js'
import { useSpatialStore } from '@/stores/spatial.js'
import { useMapStyles }    from '@/composables/useMapStyles.js'
import { useMapBasemaps }  from '@/composables/useMapBasemaps.js'

// OpenLayers core
import Map          from 'ol/Map'
import View         from 'ol/View'
import VectorLayer  from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON      from 'ol/format/GeoJSON'
import Feature      from 'ol/Feature'
import Point        from 'ol/geom/Point'
import Overlay      from 'ol/Overlay'
import { fromLonLat }             from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import { Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle } from 'ol/style'
import 'ol/ol.css'

// PrimeVue
import Button    from 'primevue/button'
import Select    from 'primevue/select'
import InputText from 'primevue/inputtext'
import Dialog    from 'primevue/dialog'

// Sub-components
import BasemapSwitcher from '@/composables/map/BasemapSwitcher.vue'
import MapPopup        from '@/composables/map/MapPopup.vue'
import MapLegend       from '@/composables/map/MapLegend.vue'
import MapSidebar      from '@/composables/map/MapSidebar.vue'
import BoundaryUpload  from '@/components/BoundaryUpload.vue'

const router       = useRouter()
const farmsStore   = useFarmsStore()
const alertsStore  = useAlertsStore()
const spatialStore = useSpatialStore()
const { getFeatureStyle } = useMapStyles()

// ── Map refs ──────────────────────────────────────────────────
const mapContainer   = ref(null)
const popupContainer = ref(null)
const mapInstance    = ref(null)
const overlayObj     = ref(null)

// Vector sources — created once, never reassigned
const farmSource      = new VectorSource()
const subcountySource = new VectorSource()
const marketSource    = new VectorSource()

// State
const popupFarm         = ref(null)
const hoveredFarm       = ref(null)
const selectedFarm      = ref(null)
const showSidebar       = ref(false)
const showUploadDialog  = ref(false)
const activeBasemap     = ref('osm')
const layersVisible     = ref({ subcounties: true, markets: true })
let   basemaps          = null

// ── Filters ───────────────────────────────────────────────────
const searchQuery    = ref('')
const selectedRegion = ref('all')
const selectedHealth = ref('all')

const regions = [
  { label: 'All Regions', value: 'all' },
  { label: 'Lugari',      value: 'Lugari' },
  { label: 'Likuyani',    value: 'Likuyani' },
  { label: 'Malava',      value: 'Malava' },
  { label: 'Lurambi',     value: 'Lurambi' },
  { label: 'Navakholo',   value: 'Navakholo' },
  { label: 'Mumias East', value: 'Mumias East' },
  { label: 'Mumias West', value: 'Mumias West' },
  { label: 'Matungu',     value: 'Matungu' },
  { label: 'Butere',      value: 'Butere' },
  { label: 'Khwisero',    value: 'Khwisero' },
  { label: 'Shinyalu',    value: 'Shinyalu' },
  { label: 'Ikolomani',   value: 'Ikolomani' },
]

const healthFilters = [
  { label: 'All Farms',       value: 'all' },
  { label: 'Excellent (80+)', value: 'excellent' },
  { label: 'Good (60–79)',    value: 'good' },
  { label: 'Fair (40–59)',    value: 'fair' },
  { label: 'Poor (<40)',      value: 'poor' },
]

// ── Computed ──────────────────────────────────────────────────
const filteredFarms = computed(() => {
  let list = farmsStore.farms

  if (selectedRegion.value !== 'all')
    list = list.filter(f =>
        f.subcounty_name === selectedRegion.value ||
        f.subCounty      === selectedRegion.value
    )

  if (selectedHealth.value !== 'all')
    list = list.filter(f => {
      const h = f.current_health?.score ?? 0
      if (selectedHealth.value === 'excellent') return h >= 80
      if (selectedHealth.value === 'good')      return h >= 60 && h < 80
      if (selectedHealth.value === 'fair')      return h >= 40 && h < 60
      if (selectedHealth.value === 'poor')      return h < 40
    })

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.owner?.toLowerCase().includes(q) ||
        f.crop_type?.toLowerCase().includes(q)
    )
  }

  return list
})

const mapStats = computed(() => {
  const f = filteredFarms.value
  const score = x => x.current_health?.score ?? 0
  return {
    total:     f.length,
    excellent: f.filter(x => score(x) >= 80).length,
    good:      f.filter(x => score(x) >= 60 && score(x) < 80).length,
    fair:      f.filter(x => score(x) >= 40 && score(x) < 60).length,
    poor:      f.filter(x => score(x) < 40).length,
  }
})

// ── Styles ────────────────────────────────────────────────────
const subcountyStyle = new Style({
  fill:   new Fill({ color: 'rgba(99, 102, 241, 0.05)' }),
  stroke: new Stroke({ color: 'rgba(99, 102, 241, 0.6)', width: 1.5, lineDash: [6, 4] }),
  text:   new TextStyle({
    font:   'bold 11px sans-serif',
    fill:   new Fill({ color: 'rgba(99,102,241,0.9)' }),
    stroke: new Stroke({ color: '#fff', width: 3 }),
  })
})

function subcountyStyleFn(feature) {
  const s = subcountyStyle.clone()
  s.getText().setText(feature.get('name') || '')
  return s
}

function marketStyleFn(feature) {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill:   new Fill({ color: 'rgba(234, 179, 8, 0.9)' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
    text: new TextStyle({
      text:    feature.get('name') || '',
      font:    '10px sans-serif',
      fill:    new Fill({ color: '#713f12' }),
      stroke:  new Stroke({ color: '#fff', width: 2 }),
      offsetY: -14,
    })
  })
}

// Single style fn — getFeatureStyle handles Polygon vs Point automatically
function farmStyleFn(feature) {
  const farm = feature.get('farm')
  if (!farm) return null
  return getFeatureStyle(feature, {
    selected: selectedFarm.value?.id === farm.id,
    hovered:  hoveredFarm.value?.id  === farm.id,
  })
}

// ── Map init ──────────────────────────────────────────────────
function initMap() {
  overlayObj.value = new Overlay({
    element:     popupContainer.value,
    autoPan:     { animation: { duration: 250 } },
    positioning: 'bottom-center',
    stopEvent:   false,
    offset:      [0, -10],
  })

  const subcountyLayer = new VectorLayer({ source: subcountySource, style: subcountyStyleFn, zIndex: 1 })
  const marketLayer    = new VectorLayer({ source: marketSource,    style: marketStyleFn,    zIndex: 2 })
  const farmLayer      = new VectorLayer({ source: farmSource,      style: farmStyleFn,      zIndex: 3 })

  mapInstance.value = new Map({
    target:   mapContainer.value,
    layers:   [subcountyLayer, marketLayer, farmLayer],
    overlays: [overlayObj.value],
    view:     new View({ center: fromLonLat([34.7519, 0.2827]), zoom: 11 }),
    controls: defaultControls({ attribution: false }),
  })

  basemaps = useMapBasemaps(mapInstance.value, activeBasemap.value)

  // Click — farms only
  mapInstance.value.on('click', evt => {
    const feat = mapInstance.value.forEachFeatureAtPixel(evt.pixel, f => f,
        { layerFilter: l => l === farmLayer }
    )
    if (feat) {
      const farm = feat.get('farm')
      selectedFarm.value = farm
      popupFarm.value    = farm
      farmSource.changed()

      // For polygons: anchor popup at interior point so it doesn't fly off-farm
      const geom = feat.getGeometry()
      const type = geom.getType()
      const pos  = (type === 'Polygon' || type === 'MultiPolygon')
          ? (geom.getInteriorPoint?.()?.getCoordinates() ?? evt.coordinate)
          : geom.getCoordinates()
      overlayObj.value.setPosition(pos)
    } else {
      closePopup()
    }
  })

  // Hover
  mapInstance.value.on('pointermove', evt => {
    const feat = mapInstance.value.forEachFeatureAtPixel(evt.pixel, f => f,
        { layerFilter: l => l === farmLayer }
    )
    hoveredFarm.value = feat ? feat.get('farm') : null
    mapInstance.value.getTargetElement().style.cursor = feat ? 'pointer' : ''
    farmSource.changed()
  })
}

// ── Load farm features (point fallback) ──────────────────────
function loadFarmFeatures() {
  if (!farmSource) return
  farmSource.clear()

  filteredFarms.value.forEach(farm => {
    if (!farm.latitude || !farm.longitude) return
    const feat = new Feature({
      geometry: new Point(fromLonLat([parseFloat(farm.longitude), parseFloat(farm.latitude)])),
      farm,
    })
    farmSource.addFeature(feat)
  })

  if (farmSource.getFeatures().length) {
    const ext = farmSource.getExtent()
    mapInstance.value?.getView().fit(ext, { padding: [60,60,60,60], maxZoom: 14 })
  }
}

// ── Load spatial layers from /api/spatial/overview ───────────
async function loadSpatialLayers() {
  try {
    const data = await spatialStore.fetchMapOverview()
    const geoJsonFormat = new GeoJSON()

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

    if (data.layers?.farms?.features?.length) {
      const farmMap = Object.fromEntries(farmsStore.farms.map(f => [f.id, f]))
      const features = geoJsonFormat.readFeatures(data.layers.farms, { featureProjection: 'EPSG:3857' })

      // Attach full farm object (health data etc.) to each spatial feature
      features.forEach(feat => {
        const full = farmMap[feat.get('id')]
        if (full) feat.set('farm', full)
      })

      farmSource.clear()
      farmSource.addFeatures(features.filter(f => f.get('farm')))

      if (farmSource.getFeatures().length) {
        mapInstance.value?.getView().fit(
            farmSource.getExtent(), { padding: [60,60,60,60], maxZoom: 14 }
        )
      }
    } else {
      loadFarmFeatures()
    }

  } catch (err) {
    console.warn('Spatial overview failed, falling back to lat/lon points:', err)
    loadFarmFeatures()
  }
}

// ── After upload — refresh farms + reload map ─────────────────
async function onBoundaryUploaded() {
  showUploadDialog.value = false
  await farmsStore.fetchFarms()
  await loadSpatialLayers()
}

// ── Popup helpers ─────────────────────────────────────────────
function closePopup() {
  overlayObj.value?.setPosition(undefined)
  popupFarm.value    = null
  selectedFarm.value = null
  farmSource.changed()
}

function centerOnFarm(farm) {
  if (!mapInstance.value) return
  const feat = farmSource.getFeatures().find(f => f.get('farm')?.id === farm.id)
  if (!feat) return
  const geom = feat.getGeometry()
  const type = geom.getType()
  const pos  = (type === 'Polygon' || type === 'MultiPolygon')
      ? (geom.getInteriorPoint?.()?.getCoordinates() ?? geom.getFirstCoordinate())
      : geom.getCoordinates()
  mapInstance.value.getView().fit(geom.getExtent(), { padding: [100,100,100,100], maxZoom: 16, duration: 500 })
  selectedFarm.value = farm
  popupFarm.value    = farm
  overlayObj.value.setPosition(pos)
  farmSource.changed()
}

function resetFilters() {
  searchQuery.value    = ''
  selectedRegion.value = 'all'
  selectedHealth.value = 'all'
}

function toggleLayer(key) {
  layersVisible.value[key] = !layersVisible.value[key]
  mapInstance.value?.getLayers().forEach(l => {
    const src = l.getSource?.()
    if (key === 'subcounties' && src === subcountySource)
      l.setVisible(layersVisible.value.subcounties)
    if (key === 'markets' && src === marketSource)
      l.setVisible(layersVisible.value.markets)
  })
}

// ── Watchers ──────────────────────────────────────────────────
watch(activeBasemap, id => basemaps?.switchBasemap(id))

watch([selectedRegion, selectedHealth, searchQuery], () => {
  if (mapInstance.value) loadFarmFeatures()
})

watch(() => farmsStore.farms, farms => {
  alertsStore.generateAlerts(farms)
  if (mapInstance.value) loadSpatialLayers()
}, { immediate: true })

// ── Mount ─────────────────────────────────────────────────────
onMounted(async () => {
  await farmsStore.fetchFarms()
  nextTick(async () => {
    initMap()
    await loadSpatialLayers()
  })
})
</script>

<template>
  <div class="farm-map-page">

    <!-- Controls bar -->
    <div class="map-controls">
      <div class="flex flex-wrap gap-3 items-center">
        <span class="p-input-icon-left flex-1 min-w-[180px]">
          <i class="pi pi-search" />
          <InputText v-model="searchQuery" placeholder="Search farms…" class="w-full" />
        </span>

        <Select v-model="selectedRegion" :options="regions"
                optionLabel="label" optionValue="value"
                placeholder="All Subcounties" class="w-48" />

        <Select v-model="selectedHealth" :options="healthFilters"
                optionLabel="label" optionValue="value"
                placeholder="All Farms" class="w-44" />

        <Button icon="pi pi-filter-slash" label="Reset"
                severity="secondary" outlined size="small"
                @click="resetFilters" />

        <!-- NEW: Upload Boundaries button -->
        <Button icon="pi pi-upload" label="Upload Boundaries"
                severity="secondary" outlined size="small"
                @click="showUploadDialog = true" />

        <Button icon="pi pi-plus" label="Add Farm" size="small"
                @click="router.push('/farms/add')" />
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        <div v-for="stat in [
          { label:'Total',     value: mapStats.total,     cls:'gray'   },
          { label:'Excellent', value: mapStats.excellent, cls:'green'  },
          { label:'Good',      value: mapStats.good,      cls:'blue'   },
          { label:'Fair',      value: mapStats.fair,      cls:'orange' },
          { label:'Poor',      value: mapStats.poor,      cls:'red'    },
        ]" :key="stat.label" class="stat-card" :class="`stat-card--${stat.cls}`">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- Map -->
    <div class="map-wrapper">
      <div ref="mapContainer" class="map-container"></div>

      <!-- Popup -->
      <div ref="popupContainer" class="ol-popup">
        <MapPopup :farm="popupFarm"
                  @close="closePopup"
                  @view="router.push(`/farms/${$event}`)" />
      </div>

      <!-- Bottom-left: legend -->
      <div class="map-legend">
        <MapLegend />
      </div>

      <!-- Bottom-center: basemap switcher -->
      <div class="map-basemap-switcher">
        <BasemapSwitcher v-model="activeBasemap" />
      </div>

      <!-- Bottom-right: layer toggles -->
      <div class="map-layer-controls">
        <div class="layer-toggle-panel">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Layers</p>
          <button class="layer-btn" :class="{ 'layer-btn--on': layersVisible.subcounties }"
                  @click="toggleLayer('subcounties')">
            <span class="layer-dot" style="background:rgba(99,102,241,0.7)"></span>
            Subcounties
          </button>
          <button class="layer-btn" :class="{ 'layer-btn--on': layersVisible.markets }"
                  @click="toggleLayer('markets')">
            <span class="layer-dot" style="background:rgba(234,179,8,0.9)"></span>
            Markets
          </button>
        </div>
      </div>

      <!-- Top-right: farm list button -->
      <div class="map-farm-list-btn">
        <Button icon="pi pi-list" label="Farm List"
                severity="info" size="small"
                @click="showSidebar = true" />
      </div>

      <!-- Loading overlay -->
      <div v-if="spatialStore.loading" class="map-loading">
        <i class="pi pi-spin pi-spinner text-2xl text-white"></i>
      </div>
    </div>

    <!-- Sidebar -->
    <MapSidebar
        v-model:visible="showSidebar"
        v-model:selectedFarm="selectedFarm"
        :farms="filteredFarms"
        @center="centerOnFarm"
        @view="router.push(`/farms/${$event}`)"
    />

    <!-- Boundary Upload Dialog -->
    <Dialog
        v-model:visible="showUploadDialog"
        header="Upload Farm Boundaries"
        :style="{ width: '500px' }"
        :modal="true"
        :draggable="false"
    >
      <BoundaryUpload @uploaded="onBoundaryUploaded" />
    </Dialog>

  </div>
</template>

<style scoped>
.farm-map-page { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.map-controls  { flex-shrink: 0; padding: 12px 16px; background: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08); z-index: 100; }
.map-wrapper   { flex: 1; position: relative; overflow: hidden; }
.map-container { width: 100%; height: 100%; }

/* Stats */
.stat-card        { padding: 10px 12px; border-radius: 8px; border: 1px solid; }
.stat-label       { font-size: 0.7rem; margin-bottom: 2px; }
.stat-value       { font-size: 1.4rem; font-weight: 800; }
.stat-card--gray  { background:#f9fafb; border-color:#e5e7eb; color:#374151; }
.stat-card--green { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
.stat-card--blue  { background:#eff6ff; border-color:#bfdbfe; color:#1e40af; }
.stat-card--orange{ background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.stat-card--red   { background:#fef2f2; border-color:#fecaca; color:#991b1b; }

/* Popup */
.ol-popup { position: absolute; bottom: 12px; left: -50px; }

/* Floating UI positions */
.map-legend          { position: absolute; bottom: 20px; left: 16px;  z-index: 1000; }
.map-basemap-switcher{ position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; }
.map-layer-controls  { position: absolute; bottom: 20px; right: 16px; z-index: 1000; }
.map-farm-list-btn   { position: absolute; top: 16px;    right: 16px; z-index: 1000; }

/* Layer toggle panel */
.layer-toggle-panel {
  background: white; border-radius: 10px; padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12); display: flex; flex-direction: column; gap: 6px;
}
.layer-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 8px; border-radius: 6px; border: 1px solid #e5e7eb;
  background: #f9fafb; cursor: pointer; font-size: 12px; font-weight: 500;
  color: #6b7280; transition: all 0.15s;
}
.layer-btn--on  { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
.layer-dot      { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* Loading overlay */
.map-loading {
  position: absolute; inset: 0; background: rgba(0,0,0,0.25);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
</style>