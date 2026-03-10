<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }         from 'vue-router'
import { useFarmsStore }     from '@/stores/farms'
import { useSatelliteStore } from '@/stores/satellite'

import Card          from 'primevue/card'
import Button        from 'primevue/button'
import Skeleton      from 'primevue/skeleton'
import Tag           from 'primevue/tag'
import Select        from 'primevue/select'
import Message       from 'primevue/message'

import SatelliteTab  from '@/components/farm-detail/SatelliteTab.vue'

const router         = useRouter()
const farmsStore     = useFarmsStore()
const satelliteStore = useSatelliteStore()

const selectedFarmId = ref(null)
const coverage       = ref(null)
const loadingCoverage = ref(false)

const farmOptions = computed(() =>
    farmsStore.farms.map(f => ({ label: f.name, value: f.id, crop: f.crop_type }))
)

const selectedFarm = computed(() =>
    farmsStore.farms.find(f => f.id === selectedFarmId.value) ?? null
)

// ── Index reference table ────────────────────────────────────
const INDEX_GUIDE = [
  {
    key: 'NDVI', icon: '🌿', name: 'Normalized Difference Vegetation Index',
    range: '-1 to 1', good: '0.4 – 0.9',
    desc: 'Measures overall crop greenness. High values = dense, healthy vegetation.',
    tip: 'Best for established crops. Less reliable on bare soil during early growth.',
  },
  {
    key: 'SAVI', icon: '🌱', name: 'Soil-Adjusted Vegetation Index',
    range: '-1 to 1', good: '0.3 – 0.7',
    desc: 'Like NDVI but corrects for bare soil interference. Ideal for young or sparse crops.',
    tip: 'Use SAVI over NDVI for maize in the first 4–6 weeks after planting.',
  },
  {
    key: 'NDWI', icon: '💧', name: 'Normalized Difference Water Index',
    range: '-1 to 1', good: '0.1 – 0.5',
    desc: 'Detects water stress in leaves before visible wilting occurs.',
    tip: 'Irrigate when NDWI drops below 0.0. Acts as an early warning system.',
  },
  {
    key: 'LAI', icon: '🍃', name: 'Leaf Area Index',
    range: '0 to 8+', good: '2.0 – 6.0',
    desc: 'Total leaf area per unit ground area. Directly correlates with yield potential.',
    tip: 'LAI < 1.5 during vegetative stage indicates poor stand or nutrient stress.',
  },
]

const severityMap = {
  excellent: 'success', good: 'success', high: 'success', adequate: 'success', dense: 'success',
  moderate: 'warning', medium: 'warning', low: 'warning', sparse: 'warning',
  stressed: 'danger', bare: 'danger', dry: 'danger', poor: 'danger',
  unknown: 'secondary',
}

async function loadCoverage() {
  loadingCoverage.value = true
  try {
    const res = await satelliteStore.fetchCoverage()
    coverage.value = res
  } finally {
    loadingCoverage.value = false
  }
}

onMounted(async () => {
  if (!farmsStore.farms.length) await farmsStore.fetchFarms()
  if (farmsStore.farms.length)  selectedFarmId.value = farmsStore.farms[0].id
  await loadCoverage()
})
</script>

<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">🛰️ Satellite Intelligence</h1>
        <p class="text-gray-600 mt-1">
          Agricultural spectral indices from Sentinel-2 via Google Earth Engine
        </p>
      </div>
      <Button
          label="Refresh All"
          icon="pi pi-refresh"
          outlined
          :loading="satelliteStore.loading"
          @click="loadCoverage"
      />
    </div>

    <!-- Coverage Banner -->
    <div v-if="coverage" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-black text-gray-900">{{ coverage.total_farms }}</div>
          <div class="text-sm text-gray-500 mt-1">Total Farms</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-black text-green-600">{{ coverage.farms_with_recent_data }}</div>
          <div class="text-sm text-gray-500 mt-1">Monitored (30d)</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-black text-orange-500">{{ coverage.farms_without_data }}</div>
          <div class="text-sm text-gray-500 mt-1">No Recent Data</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-black text-blue-600">{{ coverage.coverage_percent }}%</div>
          <div class="text-sm text-gray-500 mt-1">Coverage Rate</div>
        </template>
      </Card>
    </div>
    <div v-else class="grid grid-cols-4 gap-4">
      <Skeleton v-for="i in 4" :key="i" height="90px" border-radius="12px" />
    </div>

    <!-- Farm Selector + Indices Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left: Farm picker -->
      <div class="space-y-4">
        <Card>
          <template #title><span class="text-base font-semibold">Select Farm</span></template>
          <template #content>
            <Select
                v-model="selectedFarmId"
                :options="farmOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Choose a farm…"
                class="w-full"
                filter
            />

            <!-- Selected farm summary -->
            <div v-if="selectedFarm" class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Crop</span>
                <span class="font-semibold">{{ selectedFarm.crop_type ?? '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Area</span>
                <span class="font-semibold">{{ selectedFarm.area_ha?.toFixed(1) }} ha</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Status</span>
                <Tag
                    :value="selectedFarm.current_health?.status ?? 'unknown'"
                    :severity="severityMap[selectedFarm.current_health?.status] ?? 'secondary'"
                    class="capitalize"
                />
              </div>
              <div class="pt-2 border-t mt-2">
                <Button
                    label="View Full Farm Detail"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    text
                    size="small"
                    class="w-full"
                    @click="router.push(`/farms/${selectedFarmId}`)"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Farm list (quick-switch) -->
        <Card>
          <template #title><span class="text-base font-semibold">All Farms</span></template>
          <template #content>
            <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div
                  v-for="f in farmsStore.farms"
                  :key="f.id"
                  class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-sm"
                  :class="selectedFarmId === f.id
                  ? 'bg-primary-50 border border-primary-300'
                  : 'hover:bg-gray-50 border border-transparent'"
                  @click="selectedFarmId = f.id"
              >
                <div>
                  <p class="font-semibold text-gray-900">{{ f.name }}</p>
                  <p class="text-xs text-gray-400">{{ f.crop_type }}</p>
                </div>
                <Tag
                    :value="f.current_health?.status ?? '?'"
                    :severity="severityMap[f.current_health?.status] ?? 'secondary'"
                    class="capitalize text-xs"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Right: Indices panel -->
      <div class="lg:col-span-2">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold">
                {{ selectedFarm?.name ?? 'Select a farm' }} — Spectral Indices
              </span>
            </div>
          </template>
          <template #content>
            <SatelliteTab
                v-if="selectedFarmId"
                :farm-id="selectedFarmId"
                :farm="selectedFarm"
            />
            <div v-else class="text-center py-12 text-gray-400">
              <i class="pi pi-arrow-left text-3xl mb-3 block"></i>
              <p>Select a farm to view its satellite indices</p>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Index Reference Guide -->
    <Card>
      <template #title>
        <span class="text-base font-semibold">📖 Index Reference Guide</span>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
              v-for="idx in INDEX_GUIDE"
              :key="idx.key"
              class="rounded-xl border border-gray-200 p-4 bg-gray-50"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">{{ idx.icon }}</span>
              <div>
                <p class="font-bold text-gray-900">{{ idx.key }}</p>
                <p class="text-xs text-gray-400">{{ idx.name }}</p>
              </div>
              <span class="ml-auto text-xs text-green-700 bg-green-100 rounded px-2 py-0.5 font-mono">
                ✓ {{ idx.good }}
              </span>
            </div>
            <p class="text-sm text-gray-700 mb-2">{{ idx.desc }}</p>
            <p class="text-xs text-blue-700 bg-blue-50 rounded p-2">
              💡 {{ idx.tip }}
            </p>
          </div>
        </div>
      </template>
    </Card>

  </div>
</template>