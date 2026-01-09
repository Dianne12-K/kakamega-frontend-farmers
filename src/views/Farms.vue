<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataView from 'primevue/dataview'

const router = useRouter()
const farmsStore = useFarmsStore()

const searchQuery = ref('')
const filterStatus = ref('all')
const sortBy = ref('health')

const statusOptions = [
  { label: 'All Farms', value: 'all' },
  { label: 'Healthy', value: 'healthy' },
  { label: 'Watch', value: 'watch' },
  { label: 'Critical', value: 'critical' }
]

const sortOptions = [
  { label: 'Health Score', value: 'health' },
  { label: 'Name', value: 'name' },
  { label: 'Area', value: 'area' },
  { label: 'Crop Type', value: 'crop' }
]

const filteredFarms = computed(() => {
  let farms = [...farmsStore.farms]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    farms = farms.filter(farm =>
        farm.name.toLowerCase().includes(query) ||
        farm.crop_type?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (filterStatus.value !== 'all') {
    farms = farms.filter(farm =>
        farm.current_health?.status === filterStatus.value
    )
  }

  // Sort
  farms.sort((a, b) => {
    switch (sortBy.value) {
      case 'health':
        return (b.current_health?.score || 0) - (a.current_health?.score || 0)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'area':
        return (b.area_ha || 0) - (a.area_ha || 0)
      case 'crop':
        return (a.crop_type || '').localeCompare(b.crop_type || '')
      default:
        return 0
    }
  })

  return farms
})

const getHealthColor = (status) => {
  const colors = {
    healthy: 'text-green-600 bg-green-50',
    watch: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50'
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

const getMoistureColor = (status) => {
  const colors = {
    wet: 'text-blue-600 bg-blue-50',
    adequate: 'text-green-600 bg-green-50',
    low: 'text-orange-600 bg-orange-50',
    dry: 'text-red-600 bg-red-50'
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

onMounted(() => {
  if (farmsStore.farms.length === 0) {
    farmsStore.fetchFarms()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">All Farms</h1>
        <p class="text-gray-600 mt-1">{{ filteredFarms.length }} farms found</p>
      </div>
      <Button
          label="Add New Farm"
          icon="pi pi-plus"
          @click="router.push('/farms/add')"
      />
    </div>

    <!-- Filters -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex-1">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                  v-model="searchQuery"
                  placeholder="Search farms..."
                  class="w-full"
              />
            </span>
          </div>

          <Dropdown
              v-model="filterStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by status"
              class="w-full"
          />

          <Dropdown
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sort by"
              class="w-full"
          />
        </div>
      </template>
    </Card>

    <!-- Farms Grid -->
    <div v-if="farmsStore.loading" class="text-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      <p class="mt-4 text-gray-600">Loading farms...</p>
    </div>

    <div v-else-if="filteredFarms.length === 0" class="text-center py-12">
      <i class="pi pi-inbox text-6xl text-gray-300"></i>
      <p class="mt-4 text-gray-600">No farms found</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
          v-for="farm in filteredFarms"
          :key="farm.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="router.push(`/farms/${farm.id}`)"
      >
        <template #header>
          <div
              class="h-32 flex items-center justify-center"
              :class="getHealthColor(farm.current_health?.status)"
          >
            <div class="text-center">
              <div class="text-4xl font-bold">
                {{ farm.current_health?.score || 0 }}
              </div>
              <div class="text-sm font-semibold uppercase mt-1">
                {{ farm.current_health?.status || 'Unknown' }}
              </div>
            </div>
          </div>
        </template>

        <template #title>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ farm.name }}</h3>
              <p class="text-sm text-gray-600">{{ farm.crop_type || 'Unknown crop' }}</p>
            </div>
            <i class="pi pi-map-marker text-gray-400"></i>
          </div>
        </template>

        <template #content>
          <div class="space-y-3">
            <!-- Farm Details -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Area:</span>
              <span class="font-semibold">{{ farm.area_ha?.toFixed(1) }} ha</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Planted:</span>
              <span class="font-semibold">
                {{ farm.planting_date ? new Date(farm.planting_date).toLocaleDateString() : 'N/A' }}
              </span>
            </div>

            <!-- Moisture Status -->
            <div class="pt-2 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Soil Moisture:</span>
                <span
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    :class="getMoistureColor(farm.current_moisture?.status)"
                >
                  {{ farm.current_moisture?.status || 'N/A' }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-3 flex gap-2">
              <Button
                  label="View Details"
                  text
                  size="small"
                  class="flex-1"
                  @click.stop="router.push(`/farms/${farm.id}`)"
              />
              <Button
                  icon="pi pi-refresh"
                  text
                  size="small"
                  @click.stop="farmsStore.refreshFarmData(farm.id)"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>