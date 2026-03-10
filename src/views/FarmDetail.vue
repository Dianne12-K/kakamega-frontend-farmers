<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmsStore }     from '@/stores/farms'
import { useSatelliteStore } from '@/stores/satellite'
import { useToast }          from 'primevue/usetoast'

import Card       from 'primevue/card'
import Button     from 'primevue/button'
import TabView    from 'primevue/tabview'
import TabPanel   from 'primevue/tabpanel'
import Skeleton   from 'primevue/skeleton'
import Tag        from 'primevue/tag'

import HealthTab         from '@/components/farm-detail/HealthTab.vue'
import MoistureTab       from '@/components/farm-detail/MoistureTab.vue'
import WeatherTab        from '@/components/farm-detail/WeatherTab.vue'
import SatelliteTab      from '@/components/farm-detail/SatelliteTab.vue'
import RecommendationCard from '@/components/RecommendationCard.vue'

const route          = useRoute()
const router         = useRouter()
const farmsStore     = useFarmsStore()
const satelliteStore = useSatelliteStore()
const toast          = useToast()

const farmId = computed(() => parseInt(route.params.id))

const farm           = ref(null)
const healthData     = ref(null)
const moistureData   = ref(null)
const weatherData    = ref(null)
const recommendation = ref(null)
const loading        = ref(true)
const activeTab      = ref(0)

// ── Load farm data ────────────────────────────────────────────
const loadFarmData = async () => {
  loading.value = true
  try {
    // fetchFarmById returns the full farm object
    const data = await farmsStore.fetchFarmById(farmId.value)
    farm.value = data?.farm ?? data

    // Load supporting data in parallel
    const [healthRes, moistureRes, recRes] = await Promise.allSettled([
      farmsStore.fetchFarmNDVI(farmId.value),
      farmsStore.fetchFarmIndices(farmId.value),
      farmsStore.fetchRecommendation(farmId.value),
    ])

    if (healthRes.status === 'fulfilled')
      healthData.value = healthRes.value

    if (moistureRes.status === 'fulfilled') {
      const indices = moistureRes.value?.indices
      moistureData.value = indices
          ? { moisture_percent: indices.ndwi?.value, status: indices.ndwi?.interpretation?.status }
          : null
    }

    if (recRes.status === 'fulfilled')
      recommendation.value = recRes.value

  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load farm data', life: 3000 })
  } finally {
    loading.value = false
  }
}

// ── Manual refresh (triggers GEE pull) ───────────────────────
const refreshData = async () => {
  try {
    await farmsStore.refreshFarmSatelliteData(farmId.value)
    await loadFarmData()
    toast.add({ severity: 'success', summary: 'Refreshed', detail: 'Satellite data updated from GEE', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Refresh failed', life: 3000 })
  }
}

// ── Helpers ───────────────────────────────────────────────────
const healthSeverity = (status) => ({
  healthy: 'success', watch: 'warning', critical: 'danger'
}[status] || 'secondary')

const ndviValue = computed(() =>
    healthData.value?.latest_ndvi?.ndvi?.toFixed(3)
    ?? healthData.value?.ndvi_value?.toFixed(3)
    ?? 'N/A'
)

const healthScore = computed(() =>
    healthData.value?.health_score
    ?? farm.value?.current_health?.score
    ?? 0
)

const healthStatus = computed(() =>
    healthData.value?.health_status?.status
    ?? farm.value?.current_health?.status
    ?? 'unknown'
)

const moisturePercent = computed(() =>
    moistureData.value?.moisture_percent
    ?? farm.value?.current_moisture?.percent
    ?? 0
)

onMounted(loadFarmData)
</script>

<template>
  <div class="space-y-6">

    <!-- Back -->
    <Button label="Back to Farms" icon="pi pi-arrow-left" text @click="router.push('/farms')" />

    <!-- Farm Header -->
    <Card v-if="!loading && farm">
      <template #content>
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-4 flex-wrap">
              <h1 class="text-3xl font-bold text-gray-900">{{ farm.name }}</h1>
              <Tag
                  v-if="healthStatus !== 'unknown'"
                  :value="healthStatus.toUpperCase()"
                  :severity="healthSeverity(healthStatus)"
              />
            </div>
            <div class="flex items-center gap-6 mt-4 text-gray-600 flex-wrap">
              <div class="flex items-center gap-2">
                <i class="pi pi-map-marker"></i>
                <span>{{ farm.subcounty_name ?? 'Kakamega' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-leaf"></i>
                <span>{{ farm.crop_type || 'Unknown crop' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-line"></i>
                <span>{{ farm.area_ha?.toFixed(1) }} ha</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-calendar"></i>
                <span>Planted: {{ farm.planting_date
                    ? new Date(farm.planting_date).toLocaleDateString() : 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <Button label="Refresh Data" icon="pi pi-refresh" outlined @click="refreshData"
                    :loading="farmsStore.loading" />
            <Button label="Edit Farm"    icon="pi pi-pencil"  outlined />
          </div>
        </div>
      </template>
    </Card>

    <Card v-else>
      <template #content><Skeleton height="100px" /></template>
    </Card>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Tabs (left, 2 cols) -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <TabView v-model:activeIndex="activeTab">

              <TabPanel header="🌱 Health">
                <HealthTab v-if="!loading && healthData" :data="healthData" :farm="farm" />
                <div v-else class="space-y-4">
                  <Skeleton height="200px" /><Skeleton height="300px" />
                </div>
              </TabPanel>

              <TabPanel header="💧 Moisture">
                <MoistureTab v-if="!loading && moistureData" :data="moistureData" :farm="farm" />
                <div v-else class="space-y-4"><Skeleton height="200px" /></div>
              </TabPanel>

              <TabPanel header="🛰️ Satellite">
                <SatelliteTab :farm-id="farmId" :farm="farm" />
              </TabPanel>

              <TabPanel header="☀️ Weather">
                <WeatherTab v-if="!loading && weatherData" :data="weatherData" :farm="farm" />
                <div v-else class="space-y-4"><Skeleton height="400px" /></div>
              </TabPanel>

            </TabView>
          </template>
        </Card>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-6">

        <!-- Recommendation -->
        <RecommendationCard
            v-if="!loading && recommendation"
            :recommendation="recommendation"
            :farm-id="farmId"
        />
        <Card v-else>
          <template #content><Skeleton height="200px" /></template>
        </Card>

        <!-- Quick Stats — now from real data -->
        <Card>
          <template #title><span class="text-lg">Quick Stats</span></template>
          <template #content>
            <div v-if="!loading" class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Health Score</span>
                <span class="text-lg font-bold text-primary">{{ healthScore }}/100</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">NDVI</span>
                <span class="text-lg font-bold text-green-600">{{ ndviValue }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Leaf Water (NDWI)</span>
                <span class="text-lg font-bold text-blue-600">
                  {{ moistureData?.moisture_percent?.toFixed(3) ?? '—' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Area</span>
                <span class="text-sm font-semibold">{{ farm?.area_ha?.toFixed(1) ?? '—' }} ha</span>
              </div>
            </div>
            <div v-else class="space-y-4">
              <Skeleton v-for="i in 4" :key="i" height="28px" />
            </div>
          </template>
        </Card>

        <!-- Activity Log (static for now — Phase 2: wire to DB) -->
        <Card>
          <template #title><span class="text-lg">Recent Activity</span></template>
          <template #content>
            <div class="space-y-3">
              <div class="flex items-start gap-3 text-sm">
                <i class="pi pi-check-circle text-green-600 mt-1"></i>
                <div>
                  <p class="font-semibold">Satellite data refreshed</p>
                  <p class="text-gray-600 text-xs">Today</p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <i class="pi pi-info-circle text-blue-600 mt-1"></i>
                <div>
                  <p class="font-semibold">Health assessment completed</p>
                  <p class="text-gray-600 text-xs">1 day ago</p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <i class="pi pi-satellite text-purple-600 mt-1"></i>
                <div>
                  <p class="font-semibold">Sentinel-2 pass acquired</p>
                  <p class="text-gray-600 text-xs">3 days ago</p>
                </div>
              </div>
            </div>
          </template>
        </Card>

      </div>
    </div>
  </div>
</template>