<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms'

import Card from 'primevue/card'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import ProgressBar from 'primevue/progressbar'

const router = useRouter()
const farmsStore = useFarmsStore()

// Filter options
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Healthy', value: 'healthy' },
  { label: 'Watch', value: 'watch' },
  { label: 'Critical', value: 'critical' }
]

const selectedFilter = ref('all')

// Filtered farms
const filteredFarms = computed(() => {
  if (selectedFilter.value === 'all') {
    return farmsStore.farms
  }
  return farmsStore.farms.filter(f =>
      f.current_health?.status === selectedFilter.value
  )
})

// Farms grouped by health status
const farmsByHealth = computed(() => {
  const grouped = { healthy: [], watch: [], critical: [] }
  farmsStore.farms.forEach(farm => {
    const status = farm.current_health?.status
    if (status && grouped[status]) {
      grouped[status].push(farm)
    }
  })
  return grouped
})

// Stats
const healthStats = computed(() => ({
  total: farmsStore.farms.length,
  healthy: farmsByHealth.value.healthy.length,
  watch: farmsByHealth.value.watch.length,
  critical: farmsByHealth.value.critical.length,
  averageHealth: farmsStore.farms.length > 0
      ? Math.round(
          farmsStore.farms.reduce((sum, f) => sum + (f.current_health?.score || 0), 0) /
          farmsStore.farms.length
      )
      : 0
}))

// Helper functions
const getHealthColor = (status) => {
  const colors = {
    healthy: 'text-green-600 bg-green-50 border-green-200',
    watch: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

const getHealthBadgeColor = (status) => {
  const colors = {
    healthy: 'bg-green-500',
    watch: 'bg-yellow-500',
    critical: 'bg-red-500'
  }
  return colors[status] || 'bg-gray-500'
}

const getHealthIcon = (status) => {
  const icons = {
    healthy: 'pi-check-circle',
    watch: 'pi-exclamation-triangle',
    critical: 'pi-times-circle'
  }
  return icons[status] || 'pi-info-circle'
}

const getProgressBarColor = (score) => {
  if (score >= 70) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}

const getNDVIColor = (ndvi) => {
  if (ndvi >= 0.7) return 'text-green-600'
  if (ndvi >= 0.5) return 'text-yellow-600'
  return 'text-red-600'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const handleFarmClick = (farmId) => {
  router.push(`/farms/${farmId}`)
}

// On mount
onMounted(async () => {
  if (farmsStore.farms.length === 0) {
    await farmsStore.fetchFarms()
  }
})
</script>

<template>
  <div class="health-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="pi pi-heart text-3xl text-green-500"></i>
        <h1 class="text-3xl font-bold text-gray-800">Crop Health Monitoring</h1>
      </div>
      <p class="text-gray-600">Real-time NDVI data from Sentinel-2 satellite imagery</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card class="bg-gradient-to-br from-blue-50 to-blue-100">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-1">Total Farms</p>
            <p class="text-3xl font-bold text-blue-600">{{ healthStats.total }}</p>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-green-50 to-green-100">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-1">Healthy</p>
            <p class="text-3xl font-bold text-green-600">{{ healthStats.healthy }}</p>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-yellow-50 to-yellow-100">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-1">Watch</p>
            <p class="text-3xl font-bold text-yellow-600">{{ healthStats.watch }}</p>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-red-50 to-red-100">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-1">Critical</p>
            <p class="text-3xl font-bold text-red-600">{{ healthStats.critical }}</p>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-purple-50 to-purple-100">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-1">Avg Health</p>
            <p class="text-3xl font-bold text-purple-600">{{ healthStats.averageHealth }}/100</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filter Bar -->
    <Card class="mb-6">
      <template #content>
        <div class="flex flex-wrap items-center gap-4">
          <span class="font-semibold text-gray-700">Filter:</span>
          <SelectButton
              v-model="selectedFilter"
              :options="filterOptions"
              optionLabel="label"
              optionValue="value"
          />
        </div>
      </template>
    </Card>

    <!-- Farms List by Health Status -->
    <div v-if="selectedFilter === 'all'" class="space-y-6">
      <template v-for="status in ['critical', 'watch', 'healthy']">
        <div v-if="farmsByHealth[status].length" :key="status">
          <div class="flex items-center gap-2 mb-4">
            <div :class="['w-3 h-3 rounded-full', getHealthBadgeColor(status)]"></div>
            <h2 class="text-xl font-bold text-gray-800">
              {{ status.toUpperCase() }} ({{ farmsByHealth[status].length }})
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
                v-for="farm in farmsByHealth[status]"
                :key="farm.id"
                class="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                :class="{
                'border-red-500': status === 'critical',
                'border-yellow-500': status === 'watch',
                'border-green-500': status === 'healthy'
              }"
                @click="handleFarmClick(farm.id)"
            >
              <template #content>
                <div class="space-y-3">
                  <!-- Farm Header -->
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-gray-800">{{ farm.name }}</h3>
                      <p class="text-sm text-gray-600">{{ farm.crop_type }} • {{ farm.area_ha }} ha</p>
                    </div>
                    <i :class="['pi', getHealthIcon(status), 'text-2xl', {
                      'text-red-500': status === 'critical',
                      'text-yellow-500': status === 'watch',
                      'text-green-500': status === 'healthy'
                    }]"></i>
                  </div>

                  <!-- Health Score -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-semibold text-gray-700">Health Score</span>
                      <span class="text-lg font-bold" :class="{
                        'text-red-600': status === 'critical',
                        'text-yellow-600': status === 'watch',
                        'text-green-600': status === 'healthy'
                      }">
                        {{ farm.current_health?.score || 0 }}/100
                      </span>
                    </div>
                    <ProgressBar
                        :value="farm.current_health?.score || 0"
                        :severity="getProgressBarColor(farm.current_health?.score || 0)"
                        :showValue="false"
                    />
                  </div>

                  <!-- NDVI Value -->
                  <div class="flex items-center justify-between py-2 border-t border-gray-200">
                    <span class="text-sm text-gray-600">NDVI</span>
                    <span :class="['font-bold', getNDVIColor(farm.current_health?.ndvi || 0)]">
                      {{ (farm.current_health?.ndvi || 0).toFixed(3) }}
                    </span>
                  </div>

                  <!-- Last Updated -->
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated</span>
                    <span>{{ formatDate(farm.current_health?.date) }}</span>
                  </div>

                  <!-- Action Button -->
                  <Button
                      label="View Details"
                      icon="pi pi-arrow-right"
                      :severity="status === 'critical' ? 'danger' : (status === 'watch' ? 'warning' : 'success')"
                      outlined
                      size="small"
                      class="w-full"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>
      </template>
    </div>

    <!-- Filtered View -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
          v-for="farm in filteredFarms"
          :key="farm.id"
          class="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
          :class="{
          'border-red-500': farm.current_health?.status === 'critical',
          'border-yellow-500': farm.current_health?.status === 'watch',
          'border-green-500': farm.current_health?.status === 'healthy'
        }"
          @click="handleFarmClick(farm.id)"
      >
        <template #content>
          <div class="space-y-3">
            <!-- Farm Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-bold text-lg text-gray-800">{{ farm.name }}</h3>
                <p class="text-sm text-gray-600">{{ farm.crop_type }} • {{ farm.area_ha }} ha</p>
              </div>
              <i :class="['pi', getHealthIcon(farm.current_health?.status), 'text-2xl', {
                'text-red-500': farm.current_health?.status === 'critical',
                'text-yellow-500': farm.current_health?.status === 'watch',
                'text-green-500': farm.current_health?.status === 'healthy'
              }]"></i>
            </div>

            <!-- Health Score -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-700">Health Score</span>
                <span class="text-lg font-bold" :class="{
                  'text-red-600': farm.current_health?.status === 'critical',
                  'text-yellow-600': farm.current_health?.status === 'watch',
                  'text-green-600': farm.current_health?.status === 'healthy'
                }">
                  {{ farm.current_health?.score || 0 }}/100
                </span>
              </div>
              <ProgressBar
                  :value="farm.current_health?.score || 0"
                  :severity="getProgressBarColor(farm.current_health?.score || 0)"
                  :showValue="false"
              />
            </div>

            <!-- NDVI Value -->
            <div class="flex items-center justify-between py-2 border-t border-gray-200">
              <span class="text-sm text-gray-600">NDVI</span>
              <span :class="['font-bold', getNDVIColor(farm.current_health?.ndvi || 0)]">
                {{ (farm.current_health?.ndvi || 0).toFixed(3) }}
              </span>
            </div>

            <!-- Last Updated -->
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Last updated</span>
              <span>{{ formatDate(farm.current_health?.date) }}</span>
            </div>

            <!-- Action Button -->
            <Button
                label="View Details"
                icon="pi pi-arrow-right"
                :severity="farm.current_health?.status === 'critical' ? 'danger' : (farm.current_health?.status === 'watch' ? 'warning' : 'success')"
                outlined
                size="small"
                class="w-full"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- No Farms Message -->
    <Card v-if="filteredFarms.length === 0" class="text-center py-8">
      <template #content>
        <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-700 mb-2">No Farms Found</h3>
        <p class="text-gray-600">No farms match the selected filter</p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.health-page {
  max-width: 1400px;
  margin: 0 auto;
}

:deep(.p-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-card:hover) {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.p-progressbar) {
  height: 8px;
  border-radius: 4px;
}
</style>