<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Skeleton from 'primevue/skeleton'

import HealthTab from '@/components/farm-detail/HealthTab.vue'
import MoistureTab from '@/components/farm-detail/MoistureTab.vue'
import WeatherTab from '@/components/farm-detail/WeatherTab.vue'
import RecommendationCard from '@/components/RecommendationCard.vue'

const route = useRoute()
const router = useRouter()
const farmsStore = useFarmsStore()
const toast = useToast()

const farmId = computed(() => parseInt(route.params.id))
const farm = ref(null)
const healthData = ref(null)
const moistureData = ref(null)
const weatherData = ref(null)
const recommendation = ref(null)
const loading = ref(true)

const activeTab = ref(0)

const loadFarmData = async () => {
  loading.value = true
  try {
    const data = await farmsStore.getFarmById(farmId.value)
    farm.value = data.farm
    healthData.value = data.health
    moistureData.value = data.moisture
    weatherData.value = data.weather
    recommendation.value = data.recommendation
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load farm data',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await farmsStore.refreshFarmData(farmId.value)
  await loadFarmData()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Farm data refreshed',
    life: 3000
  })
}

const getHealthBadgeClass = (status) => {
  const classes = {
    healthy: 'bg-green-100 text-green-800',
    watch: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadFarmData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <Button
        label="Back to Farms"
        icon="pi pi-arrow-left"
        text
        @click="router.push('/farms')"
    />

    <!-- Farm Header -->
    <Card v-if="!loading && farm">
      <template #content>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-4">
              <h1 class="text-3xl font-bold text-gray-900">{{ farm.name }}</h1>
              <span
                  v-if="healthData"
                  class="px-4 py-2 rounded-full text-sm font-semibold"
                  :class="getHealthBadgeClass(healthData.status)"
              >
                {{ healthData.status?.toUpperCase() }}
              </span>
            </div>

            <div class="flex items-center gap-6 mt-4 text-gray-600">
              <div class="flex items-center gap-2">
                <i class="pi pi-map-marker"></i>
                <span>Malava Sub-County</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-leaf"></i>
                <span>{{ farm.crop_type || 'Unknown' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-line"></i>
                <span>{{ farm.area_ha?.toFixed(1) }} hectares</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-calendar"></i>
                <span>Planted: {{ farm.planting_date ? new Date(farm.planting_date).toLocaleDateString() : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
                label="Refresh Data"
                icon="pi pi-refresh"
                outlined
                @click="refreshData"
            />
            <Button
                label="Edit Farm"
                icon="pi pi-pencil"
                outlined
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading Skeleton -->
    <Card v-else>
      <template #content>
        <Skeleton height="100px" />
      </template>
    </Card>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tabs Section (Left - 2 columns) -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <TabView v-model:activeIndex="activeTab">
              <TabPanel header="🌱 Health">
                <HealthTab
                    v-if="!loading && healthData"
                    :data="healthData"
                    :farm="farm"
                />
                <div v-else class="space-y-4">
                  <Skeleton height="200px" />
                  <Skeleton height="300px" />
                </div>
              </TabPanel>

              <TabPanel header="💧 Moisture">
                <MoistureTab
                    v-if="!loading && moistureData"
                    :data="moistureData"
                    :farm="farm"
                />
                <div v-else class="space-y-4">
                  <Skeleton height="200px" />
                </div>
              </TabPanel>

              <TabPanel header="☀️ Weather">
                <WeatherTab
                    v-if="!loading && weatherData"
                    :data="weatherData"
                    :farm="farm"
                />
                <div v-else class="space-y-4">
                  <Skeleton height="400px" />
                </div>
              </TabPanel>
            </TabView>
          </template>
        </Card>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-6">
        <!-- Recommendation Card -->
        <RecommendationCard
            v-if="!loading && recommendation"
            :recommendation="recommendation"
            :farm-id="farmId"
        />
        <Card v-else>
          <template #content>
            <Skeleton height="200px" />
          </template>
        </Card>

        <!-- Quick Stats -->
        <Card>
          <template #title>
            <span class="text-lg">Quick Stats</span>
          </template>
          <template #content>
            <div v-if="!loading" class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Health Score</span>
                <span class="text-lg font-bold text-primary">
                  {{ healthData?.health_score || 0 }}/100
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Soil Moisture</span>
                <span class="text-lg font-bold text-blue-600">
                  {{ moistureData?.moisture_percent || 0 }}%
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">NDVI</span>
                <span class="text-lg font-bold text-green-600">
                  {{ healthData?.ndvi_value?.toFixed(3) || 'N/A' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Updated</span>
                <span class="text-sm font-semibold">
                  {{ healthData?.created_at ? new Date(healthData.created_at).toLocaleTimeString() : 'N/A' }}
                </span>
              </div>
            </div>
            <div v-else class="space-y-4">
              <Skeleton height="30px" />
              <Skeleton height="30px" />
              <Skeleton height="30px" />
            </div>
          </template>
        </Card>

        <!-- Activity Log -->
        <Card>
          <template #title>
            <span class="text-lg">Recent Activity</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex items-start gap-3 text-sm">
                <i class="pi pi-check-circle text-green-600 mt-1"></i>
                <div>
                  <p class="font-semibold">Data refreshed</p>
                  <p class="text-gray-600 text-xs">2 hours ago</p>
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
                <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                <div>
                  <p class="font-semibold">Low moisture alert triggered</p>
                  <p class="text-gray-600 text-xs">2 days ago</p>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>