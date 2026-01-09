<script setup>
import { computed } from 'vue'
import { useFarmsStore } from '@/stores/farms'
import Card from 'primevue/card'

const farmsStore = useFarmsStore()

const stats = computed(() => {
  const totalArea = Number(farmsStore.totalArea) || 0
  const averageHealth = Number(farmsStore.averageHealthScore) || 0

  return {
    totalFarms: farmsStore.farms?.length || 0,
    totalArea: totalArea.toFixed(1),
    averageHealth: averageHealth.toFixed(0),
    criticalFarms: farmsStore.criticalFarms?.length || 0,
    healthyFarms: farmsStore.healthyFarms?.length || 0,
    dryFarms: farmsStore.dryFarms?.length || 0
  }
})
</script>


<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Farms -->
    <Card class="bg-gradient-to-br from-blue-50 to-blue-100">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Farms</p>
            <p class="text-3xl font-bold text-blue-600">{{ stats.totalFarms }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ stats.totalArea }} hectares</p>
          </div>
          <i class="pi pi-map-marker text-4xl text-blue-400"></i>
        </div>
      </template>
    </Card>

    <!-- Average Health -->
    <Card class="bg-gradient-to-br from-green-50 to-green-100">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Average Health</p>
            <p class="text-3xl font-bold text-green-600">{{ stats.averageHealth }}/100</p>
            <p class="text-xs text-gray-500 mt-1">{{ stats.healthyFarms }} healthy farms</p>
          </div>
          <i class="pi pi-heart text-4xl text-green-400"></i>
        </div>
      </template>
    </Card>

    <!-- Critical Alerts -->
    <Card class="bg-gradient-to-br from-red-50 to-red-100">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Critical Farms</p>
            <p class="text-3xl font-bold text-red-600">{{ stats.criticalFarms }}</p>
            <p class="text-xs text-gray-500 mt-1">Need immediate attention</p>
          </div>
          <i class="pi pi-exclamation-triangle text-4xl text-red-400"></i>
        </div>
      </template>
    </Card>

    <!-- Moisture Issues -->
    <Card class="bg-gradient-to-br from-orange-50 to-orange-100">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Low Moisture</p>
            <p class="text-3xl font-bold text-orange-600">{{ stats.dryFarms }}</p>
            <p class="text-xs text-gray-500 mt-1">Irrigation needed</p>
          </div>
          <i class="pi pi-cloud text-4xl text-orange-400"></i>
        </div>
      </template>
    </Card>
  </div>
</template>