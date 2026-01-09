<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms'
import { useAlertsStore } from '@/stores/alerts'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import FarmMap from '@/components/FarmMap.vue'
import StatsCards from '@/components/StatsCards.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import AlertsList from '@/components/AlertsList.vue'

const router = useRouter()
const farmsStore = useFarmsStore()
const alertsStore = useAlertsStore()

const selectedFarm = ref(null)

const priorityAlerts = computed(() => {
  return [
    ...alertsStore.criticalAlerts.slice(0, 2),
    ...alertsStore.highAlerts.slice(0, 3)
  ].slice(0, 5)
})

const handleFarmClick = (farm) => {
  selectedFarm.value = farm
}

const viewFarmDetail = (farmId) => {
  router.push(`/farms/${farmId}`)
}

onMounted(async () => {
  if (farmsStore.farms.length === 0) {
    await farmsStore.fetchFarms()
  }
  alertsStore.generateAlerts(farmsStore.farms)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Overview of all farms in Malava Sub-County</p>
      </div>
      <div class="flex gap-3">
        <Button
            label="Export Report"
            icon="pi pi-download"
            severity="secondary"
            outlined
        />
        <Button
            label="Add Farm"
            icon="pi pi-plus"
            @click="router.push('/farms/add')"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <StatsCards />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Map Section (Left - 2 columns) -->
      <div class="lg:col-span-2">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-lg">Farm Locations</span>
              <Button
                  icon="pi pi-refresh"
                  text
                  rounded
                  @click="farmsStore.fetchFarms()"
                  :loading="farmsStore.loading"
              />
            </div>
          </template>
          <template #content>
            <FarmMap
                :farms="farmsStore.farms"
                :selected-farm="selectedFarm"
                @farm-click="handleFarmClick"
                @view-detail="viewFarmDetail"
            />
          </template>
        </Card>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-6">
        <!-- Weather Widget -->
        <WeatherWidget />

        <!-- Priority Alerts -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-lg">Priority Alerts</span>
              <Button
                  label="View All"
                  text
                  size="small"
                  @click="router.push('/alerts')"
              />
            </div>
          </template>
          <template #content>
            <div v-if="priorityAlerts.length === 0" class="text-center py-8 text-gray-500">
              <i class="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
              <p>No urgent alerts</p>
            </div>

            <div v-else class="space-y-3">
              <div
                  v-for="alert in priorityAlerts"
                  :key="alert.id"
                  class="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                  :class="{
                  'bg-red-50 border-red-200': alert.priority === 'critical',
                  'bg-orange-50 border-orange-200': alert.priority === 'high',
                  'bg-yellow-50 border-yellow-200': alert.priority === 'medium'
                }"
                  @click="viewFarmDetail(alert.farmId)"
              >
                <div class="flex items-start gap-3">
                  <i
                      class="pi pi-exclamation-triangle text-xl"
                      :class="{
                      'text-red-600': alert.priority === 'critical',
                      'text-orange-600': alert.priority === 'high',
                      'text-yellow-600': alert.priority === 'medium'
                    }"
                  ></i>
                  <div class="flex-1">
                    <p class="font-semibold text-sm text-gray-900">{{ alert.farmName }}</p>
                    <p class="text-xs text-gray-700 mt-1">{{ alert.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Quick Stats -->
        <Card>
          <template #title>
            <span class="text-lg">System Status</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Data Freshness</span>
                <span class="text-sm font-semibold text-green-600">
                  <i class="pi pi-check-circle mr-1"></i>
                  Up to date
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Satellite Coverage</span>
                <span class="text-sm font-semibold text-green-600">100%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Update</span>
                <span class="text-sm font-semibold text-gray-900">2 hours ago</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Recent Activity Table -->
    <Card>
      <template #title>
        <span class="text-lg">Farms Requiring Attention</span>
      </template>
      <template #content>
        <DataTable
            :value="[...farmsStore.criticalFarms, ...farmsStore.watchFarms].slice(0, 5)"
            :rows="5"
            class="text-sm"
        >
          <Column field="name" header="Farm Name" />
          <Column field="crop_type" header="Crop" />
          <Column field="area_ha" header="Area (ha)">
            <template #body="{ data }">
              {{ data.area_ha?.toFixed(1) }}
            </template>
          </Column>
          <Column header="Health Status">
            <template #body="{ data }">
              <span
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                  'bg-green-100 text-green-800': data.current_health?.status === 'healthy',
                  'bg-yellow-100 text-yellow-800': data.current_health?.status === 'watch',
                  'bg-red-100 text-red-800': data.current_health?.status === 'critical'
                }"
              >
                {{ data.current_health?.score || 0 }}/100
              </span>
            </template>
          </Column>
          <Column header="Moisture">
            <template #body="{ data }">
              <span
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                  'bg-blue-100 text-blue-800': data.current_moisture?.status === 'wet',
                  'bg-green-100 text-green-800': data.current_moisture?.status === 'adequate',
                  'bg-orange-100 text-orange-800': data.current_moisture?.status === 'low',
                  'bg-red-100 text-red-800': data.current_moisture?.status === 'dry'
                }"
              >
                {{ data.current_moisture?.status || 'N/A' }}
              </span>
            </template>
          </Column>
          <Column header="Action">
            <template #body="{ data }">
              <Button
                  label="View"
                  text
                  size="small"
                  @click="viewFarmDetail(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>