<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }         from 'vue-router'
import { useFarmsStore }     from '@/stores/farms'
import { useSatelliteStore } from '@/stores/satellite'
import { useMLStore }        from '@/stores/ml'

import Card        from 'primevue/card'
import Button      from 'primevue/button'
import Skeleton    from 'primevue/skeleton'
import Tag         from 'primevue/tag'
import Select      from 'primevue/select'
import Message     from 'primevue/message'
import InputNumber from 'primevue/inputnumber'

import SatelliteTab from '@/components/farm-detail/SatelliteTab.vue'

const router         = useRouter()
const farmsStore     = useFarmsStore()
const satelliteStore = useSatelliteStore()
const mlStore        = useMLStore()

const selectedFarmId  = ref(null)
const coverage        = ref(null)
const loadingCoverage = ref(false)
const lcResult        = ref(null)

const lcForm = ref({
  ndvi: 0.62, savi: 0.45, ndwi: 0.12, lai: 2.1,
  health_score: 70, moisture_percent: 55,
  latitude: 0.28, longitude: 34.75,
})

const farmOptions = computed(() =>
    farmsStore.farms.map(f => ({ label: f.name, value: f.id, crop: f.crop_type }))
)

const selectedFarm = computed(() =>
    farmsStore.farms.find(f => f.id === selectedFarmId.value) ?? null
)

// ── Index reference ───────────────────────────────────────────
const INDEX_GUIDE = [
  {
    key: 'NDVI', name: 'Normalized Difference Vegetation Index',
    range: '-1 to 1', good: '0.4 – 0.9',
    desc: 'Measures overall crop greenness. High values indicate dense, healthy vegetation.',
    tip: 'Best for established crops. Less reliable on bare soil during early growth.',
  },
  {
    key: 'SAVI', name: 'Soil-Adjusted Vegetation Index',
    range: '-1 to 1', good: '0.3 – 0.7',
    desc: 'Like NDVI but corrects for bare soil interference. Ideal for young or sparse crops.',
    tip: 'Use SAVI over NDVI for maize in the first 4–6 weeks after planting.',
  },
  {
    key: 'NDWI', name: 'Normalized Difference Water Index',
    range: '-1 to 1', good: '0.1 – 0.5',
    desc: 'Detects water stress in leaves before visible wilting occurs.',
    tip: 'Irrigate when NDWI drops below 0.0. Acts as an early warning system.',
  },
  {
    key: 'LAI', name: 'Leaf Area Index',
    range: '0 to 8+', good: '2.0 – 6.0',
    desc: 'Total leaf area per unit ground area. Directly correlates with yield potential.',
    tip: 'LAI below 1.5 during vegetative stage indicates poor stand or nutrient stress.',
  },
]

const severityMap = {
  excellent: 'success', good: 'success', high: 'success', adequate: 'success', dense: 'success',
  moderate: 'warning', medium: 'warning', low: 'warning', sparse: 'warning',
  stressed: 'danger', bare: 'danger', dry: 'danger', poor: 'danger',
  unknown: 'secondary',
}

const lcFields = [
  { key: 'ndvi',             label: 'NDVI',          min: -1,   max: 1,   step: 0.01   },
  { key: 'savi',             label: 'SAVI',          min: -1,   max: 1,   step: 0.01   },
  { key: 'ndwi',             label: 'NDWI',          min: -1,   max: 1,   step: 0.01   },
  { key: 'lai',              label: 'LAI',           min: 0,    max: 10,  step: 0.1    },
  { key: 'health_score',     label: 'Health Score',  min: 0,    max: 100, step: 1      },
  { key: 'moisture_percent', label: 'Moisture %',    min: 0,    max: 100, step: 1      },
  { key: 'latitude',         label: 'Latitude',      min: -90,  max: 90,  step: 0.0001 },
  { key: 'longitude',        label: 'Longitude',     min: -180, max: 180, step: 0.0001 },
]

// ── Functions ─────────────────────────────────────────────────
async function loadCoverage() {
  loadingCoverage.value = true
  try {
    const res = await satelliteStore.fetchCoverage()
    coverage.value = res
  } finally {
    loadingCoverage.value = false
  }
}

function prefillFromFarm() {
  const farm = selectedFarm.value
  if (!farm) return
  lcForm.value.health_score     = farm.current_health?.score     ?? 70
  lcForm.value.moisture_percent = farm.current_moisture?.percent ?? 55
  lcForm.value.latitude         = parseFloat(farm.latitude)      || 0.28
  lcForm.value.longitude        = parseFloat(farm.longitude)     || 34.75
  lcForm.value.ndvi             = farm.current_health?.ndvi      ?? 0.62
}

async function classifyLandCover() {
  lcResult.value = null
  const result = await mlStore.classifyLandCover(lcForm.value)
  lcResult.value = result
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
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Satellite Intelligence</h1>
        <p class="text-sm text-gray-500 mt-1">
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
                placeholder="Choose a farm..."
                class="w-full"
                filter
            />
            <div v-if="selectedFarm" class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Crop</span>
                <span class="font-semibold capitalize">{{ selectedFarm.crop_type ?? '—' }}</span>
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
                    text size="small"
                    class="w-full"
                    @click="router.push(`/farms/${selectedFarmId}`)"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Farm list quick-switch -->
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
                  <p class="text-xs text-gray-400 capitalize">{{ f.crop_type }}</p>
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
            <span class="text-base font-semibold">
              {{ selectedFarm?.name ?? 'Select a farm' }} — Spectral Indices
            </span>
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

    <!-- Land Cover Classification -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-base font-semibold text-gray-800">Land Cover Classification</span>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            RandomForest — 10 classes
          </span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <!-- Input form -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700">Spectral Indices Input</p>
              <Button
                  label="Fill from Selected Farm"
                  icon="pi pi-download"
                  text size="small"
                  :disabled="!selectedFarmId"
                  @click="prefillFromFarm"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div v-for="field in lcFields" :key="field.key" class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">{{ field.label }}</label>
                <InputNumber
                    v-model="lcForm[field.key]"
                    :min="field.min"
                    :max="field.max"
                    :step="field.step"
                    :min-fraction-digits="2"
                    :max-fraction-digits="4"
                    size="small"
                    class="w-full"
                />
              </div>
            </div>

            <Button
                label="Classify Land Cover"
                icon="pi pi-search"
                class="w-full mt-2"
                :loading="mlStore.loading"
                @click="classifyLandCover"
            />
          </div>

          <!-- Result panel -->
          <div>
            <div v-if="mlStore.loading" class="space-y-3">
              <Skeleton height="100px" /><Skeleton height="140px" />
            </div>

            <div v-else-if="lcResult" class="space-y-5">
              <!-- Primary result -->
              <div class="rounded-xl border-2 border-green-200 bg-green-50 p-5 text-center">
                <p class="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">
                  Classified As
                </p>
                <p class="text-2xl font-extrabold text-green-800">
                  {{ lcResult.label }}
                </p>
                <p class="text-sm text-green-600 mt-1 font-medium">
                  {{ lcResult.confidence_pct }}% confidence
                </p>
              </div>

              <!-- Top 3 classes -->
              <div class="space-y-3">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Top Class Probabilities
                </p>
                <div
                    v-for="cls in lcResult.top_3_classes"
                    :key="cls.class"
                    class="flex items-center gap-3"
                >
                  <span class="text-sm text-gray-700 w-48 flex-shrink-0 capitalize">
                    {{ cls.class.replace(/_/g, ' ') }}
                  </span>
                  <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-green-500 rounded-full transition-all duration-700"
                        :style="{ width: `${cls.probability_pct}%` }"
                    />
                  </div>
                  <span class="text-sm font-bold text-gray-700 w-10 text-right flex-shrink-0">
                    {{ cls.probability_pct }}%
                  </span>
                </div>
              </div>

              <p class="text-xs text-gray-400">
                Model accuracy: {{ (lcResult.model_accuracy * 100).toFixed(1) }}% across 10 land cover classes
              </p>
            </div>

            <div v-else class="flex flex-col items-center justify-center h-full py-16 text-gray-400">
              <i class="pi pi-map text-5xl block mb-4"></i>
              <p class="text-sm text-center text-gray-500">
                Enter spectral indices and click Classify,<br>
                or use "Fill from Selected Farm" to auto-populate.
              </p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Index Reference Guide -->
    <Card>
      <template #title>
        <span class="text-base font-semibold text-gray-800">Index Reference Guide</span>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
              v-for="idx in INDEX_GUIDE"
              :key="idx.key"
              class="rounded-xl border border-gray-200 p-4 bg-gray-50"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-black text-gray-700">{{ idx.key }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-900 text-sm">{{ idx.key }}</p>
                <p class="text-xs text-gray-400 truncate">{{ idx.name }}</p>
              </div>
              <span class="text-xs text-green-700 bg-green-100 rounded px-2 py-0.5 font-mono flex-shrink-0">
                {{ idx.good }}
              </span>
            </div>
            <p class="text-sm text-gray-700 mb-2">{{ idx.desc }}</p>
            <p class="text-xs text-blue-700 bg-blue-50 rounded p-2 leading-relaxed">
              {{ idx.tip }}
            </p>
          </div>
        </div>
      </template>
    </Card>

  </div>
</template>