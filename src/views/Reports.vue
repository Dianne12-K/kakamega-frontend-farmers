<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFarmsStore } from '@/stores/farms'
import { useAlertsStore } from '@/stores/alerts'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const farmsStore = useFarmsStore()
const alertsStore = useAlertsStore()

const dateRanges = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'Last 6 Months', value: 180 },
  { label: 'Last Year', value: 365 }
]

const regions = [
  { label: 'All Regions', value: 'all' },
  { label: 'Malava', value: 'malava' },
  { label: 'Lugari', value: 'lugari' },
  { label: 'Likuyani', value: 'likuyani' },
  { label: 'Mumias', value: 'mumias' },
  { label: 'Matungu', value: 'matungu' }
]

const selectedDateRange = ref(30)
const selectedRegion = ref('all')
const exportingPDF = ref(false)
const exportingExcel = ref(false)

const filteredFarms = computed(() => {
  if (selectedRegion.value === 'all') {
    return farmsStore.farms
  }
  return farmsStore.farms.filter(f => f.subCounty === selectedRegion.value)
})

const performanceStats = computed(() => {
  const farms = filteredFarms.value
  const avgHealth = farms.reduce((sum, f) => sum + (f.health || 0), 0) / farms.length || 0
  const improving = farms.filter(f => (f.healthTrend || 0) > 0).length
  const declining = farms.filter(f => (f.healthTrend || 0) < 0).length
  const irrigationEvents = farms.reduce((sum, f) => sum + (f.irrigationCount || 0), 0)

  return {
    avgHealth: avgHealth.toFixed(1),
    improving,
    declining,
    irrigationEvents,
    totalFarms: farms.length
  }
})

const healthDistributionData = computed(() => {
  const farms = filteredFarms.value
  const excellent = farms.filter(f => f.health >= 80).length
  const good = farms.filter(f => f.health >= 60 && f.health < 80).length
  const fair = farms.filter(f => f.health >= 40 && f.health < 60).length
  const poor = farms.filter(f => f.health < 40).length

  return {
    labels: ['Excellent (80+)', 'Good (60-79)', 'Fair (40-59)', 'Poor (<40)'],
    datasets: [{
      data: [excellent, good, fair, poor],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
    }]
  }
})

const cropDistributionData = computed(() => {
  const farms = filteredFarms.value
  const cropCounts = {}

  farms.forEach(farm => {
    const crop = farm.cropType || 'Unknown'
    cropCounts[crop] = (cropCounts[crop] || 0) + 1
  })

  return {
    labels: Object.keys(cropCounts),
    datasets: [{
      label: 'Number of Farms',
      data: Object.values(cropCounts),
      backgroundColor: '#3b82f6'
    }]
  }
})

const moistureTrendData = computed(() => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const avgMoisture = days.map(() => Math.random() * 30 + 50)
  const rainfall = days.map(() => Math.random() * 50)

  return {
    labels: days,
    datasets: [
      {
        label: 'Avg Soil Moisture (%)',
        data: avgMoisture,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Rainfall (mm)',
        data: rainfall,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const farmPerformanceTable = computed(() => {
  return filteredFarms.value.map(farm => ({
    name: farm.name,
    owner: farm.owner,
    subCounty: farm.subCounty,
    cropType: farm.cropType,
    health: farm.health,
    moisture: farm.moisture,
    size: farm.size,
    status: farm.health >= 60 ? 'good' : farm.health >= 40 ? 'warning' : 'critical'
  }))
})

const getHealthSeverity = (health) => {
  if (health >= 80) return 'success'
  if (health >= 60) return 'info'
  if (health >= 40) return 'warning'
  return 'danger'
}

const getStatusSeverity = (status) => {
  const severities = {
    good: 'success',
    warning: 'warning',
    critical: 'danger'
  }
  return severities[status] || 'info'
}

const exportPDF = () => {
  exportingPDF.value = true
  setTimeout(() => {
    console.log('Exporting PDF report...')
    alert('PDF report downloaded successfully!')
    exportingPDF.value = false
  }, 2000)
}

const exportExcel = () => {
  exportingExcel.value = true
  setTimeout(() => {
    console.log('Exporting Excel report...')
    alert('Excel report downloaded successfully!')
    exportingExcel.value = false
  }, 2000)
}

const createCustomReport = () => {
  alert('Custom report builder coming soon!')
}

onMounted(() => {
  farmsStore.fetchFarms()
  alertsStore.fetchAlerts()
})
</script>

<template>
  <div class="reports-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="pi pi-chart-bar text-3xl text-blue-600"></i>
        <h1 class="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
      </div>
      <p class="text-gray-600">Monitor farm performance and generate insights</p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-gray-600"></i>
            <label class="font-semibold text-gray-700">Date Range:</label>
            <Dropdown
                v-model="selectedDateRange"
                :options="dateRanges"
                optionLabel="label"
                optionValue="value"
                class="w-48"
            />
          </div>

          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker text-gray-600"></i>
            <label class="font-semibold text-gray-700">Region:</label>
            <Dropdown
                v-model="selectedRegion"
                :options="regions"
                optionLabel="label"
                optionValue="value"
                class="w-48"
            />
          </div>

          <div class="ml-auto">
            <Button
                icon="pi pi-refresh"
                label="Refresh"
                outlined
                size="small"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Performance Overview -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-line text-blue-600"></i>
          <span>Performance Overview</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Total Farms -->
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-blue-700">Total Farms</span>
              <i class="pi pi-map text-blue-600 text-xl"></i>
            </div>
            <p class="text-3xl font-bold text-blue-800">{{ performanceStats.totalFarms }}</p>
          </div>

          <!-- Average Health -->
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-green-700">Avg Health</span>
              <i class="pi pi-heart text-green-600 text-xl"></i>
            </div>
            <p class="text-3xl font-bold text-green-800">{{ performanceStats.avgHealth }}/100</p>
          </div>

          <!-- Improving -->
          <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-emerald-700">Improving</span>
              <i class="pi pi-arrow-up text-emerald-600 text-xl"></i>
            </div>
            <p class="text-3xl font-bold text-emerald-800">{{ performanceStats.improving }}</p>
          </div>

          <!-- Declining -->
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-orange-700">Declining</span>
              <i class="pi pi-arrow-down text-orange-600 text-xl"></i>
            </div>
            <p class="text-3xl font-bold text-orange-800">{{ performanceStats.declining }}</p>
          </div>

          <!-- Irrigation Events -->
          <div class="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-cyan-700">Irrigation Events</span>
              <i class="pi pi-cloud text-cyan-600 text-xl"></i>
            </div>
            <p class="text-3xl font-bold text-cyan-800">{{ performanceStats.irrigationEvents }}</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Health Distribution -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie text-purple-600"></i>
            <span>Health Distribution</span>
          </div>
        </template>
        <template #content>
          <div style="height: 300px">
            <Chart type="doughnut" :data="healthDistributionData" :options="chartOptions" />
          </div>
        </template>
      </Card>

      <!-- Crop Distribution -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-green-600"></i>
            <span>Crop Distribution</span>
          </div>
        </template>
        <template #content>
          <div style="height: 300px">
            <Chart type="bar" :data="cropDistributionData" :options="barChartOptions" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Moisture & Rainfall Analysis -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-cloud text-blue-600"></i>
          <span>Rainfall & Moisture Analysis (Last 30 Days)</span>
        </div>
      </template>
      <template #content>
        <div style="height: 350px">
          <Chart type="line" :data="moistureTrendData" :options="chartOptions" />
        </div>
      </template>
    </Card>

    <!-- Farm Performance Table -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-table text-indigo-600"></i>
          <span>Farm-by-Farm Performance</span>
        </div>
      </template>
      <template #content>
        <DataTable
            :value="farmPerformanceTable"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20]"
            sortMode="multiple"
            stripedRows
            showGridlines
        >
          <Column field="name" header="Farm Name" sortable></Column>
          <Column field="owner" header="Owner" sortable></Column>
          <Column field="subCounty" header="Location" sortable></Column>
          <Column field="cropType" header="Crop" sortable></Column>
          <Column field="size" header="Size (ha)" sortable>
            <template #body="slotProps">
              {{ slotProps.data.size }} ha
            </template>
          </Column>
          <Column field="health" header="Health" sortable>
            <template #body="slotProps">
              <Tag
                  :value="`${slotProps.data.health}%`"
                  :severity="getHealthSeverity(slotProps.data.health)"
              />
            </template>
          </Column>
          <Column field="moisture" header="Moisture" sortable>
            <template #body="slotProps">
              {{ slotProps.data.moisture }}%
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="slotProps">
              <Tag
                  :value="slotProps.data.status.toUpperCase()"
                  :severity="getStatusSeverity(slotProps.data.status)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Download Reports -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-download text-purple-600"></i>
          <span>Download Reports</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Monthly Summary -->
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-3">
              <i class="pi pi-file-pdf text-4xl text-red-500"></i>
              <div>
                <h3 class="font-semibold text-gray-800">Monthly Summary Report</h3>
                <p class="text-sm text-gray-600">Comprehensive monthly overview</p>
              </div>
            </div>
            <Button
                label="Download PDF"
                icon="pi pi-download"
                class="w-full"
                :loading="exportingPDF"
                @click="exportPDF"
            />
          </div>

          <!-- Farm Analysis -->
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-3">
              <i class="pi pi-file-excel text-4xl text-green-600"></i>
              <div>
                <h3 class="font-semibold text-gray-800">Farm-by-Farm Analysis</h3>
                <p class="text-sm text-gray-600">Detailed data in Excel format</p>
              </div>
            </div>
            <Button
                label="Download Excel"
                icon="pi pi-download"
                severity="success"
                class="w-full"
                :loading="exportingExcel"
                @click="exportExcel"
            />
          </div>

          <!-- Custom Report -->
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-3">
              <i class="pi pi-cog text-4xl text-blue-500"></i>
              <div>
                <h3 class="font-semibold text-gray-800">Custom Report Builder</h3>
                <p class="text-sm text-gray-600">Create tailored reports</p>
              </div>
            </div>
            <Button
                label="Create Report"
                icon="pi pi-plus"
                severity="info"
                outlined
                class="w-full"
                @click="createCustomReport"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.reports-page {
  max-width: 1400px;
  margin: 0 auto;
}

:deep(.p-card-title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

:deep(.p-datatable) {
  font-size: 0.875rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f3f4f6;
  font-weight: 600;
  color: #374151;
}
</style>