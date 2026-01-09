<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'

const props = defineProps({
  farm: {
    type: Object,
    required: true
  },
  healthData: {
    type: Object,
    default: null
  },
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

// Chart data
const chartData = computed(() => {
  if (!props.history || props.history.length === 0) {
    return null
  }

  return {
    labels: props.history.map(h => {
      const date = new Date(h.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'NDVI',
        data: props.history.map(h => h.ndvi_value),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Health Score',
        data: props.history.map(h => h.health_score),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'NDVI Value'
      },
      min: 0,
      max: 1
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Health Score'
      },
      min: 0,
      max: 100,
      grid: {
        drawOnChartArea: false
      }
    }
  }
}

// Health status helpers
const getHealthColor = computed(() => {
  const status = props.healthData?.status
  if (status === 'healthy') return 'text-green-600'
  if (status === 'watch') return 'text-yellow-600'
  return 'text-red-600'
})

const getHealthBgColor = computed(() => {
  const status = props.healthData?.status
  if (status === 'healthy') return 'bg-green-50 border-green-200'
  if (status === 'watch') return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
})

const getHealthLabel = computed(() => {
  const status = props.healthData?.status
  if (status === 'healthy') return 'Healthy'
  if (status === 'watch') return 'Needs Attention'
  return 'Critical'
})

const getNDVIInterpretation = (ndvi) => {
  if (ndvi >= 0.7) return 'Dense, healthy vegetation'
  if (ndvi >= 0.5) return 'Moderate vegetation'
  if (ndvi >= 0.2) return 'Sparse vegetation'
  return 'Bare soil or stressed crops'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Current Health Status Card -->
    <Card :class="['border-l-4', getHealthBgColor]">
      <template #content>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-1">Current Health Status</h3>
              <p class="text-sm text-gray-600">
                Last updated: {{ formatDate(healthData?.date) }}
              </p>
            </div>
            <Button
                icon="pi pi-refresh"
                rounded
                text
                @click="emit('refresh')"
                :loading="false"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Health Score -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">Health Score</p>
              <p :class="['text-3xl font-bold mb-2', getHealthColor]">
                {{ healthData?.health_score || 0 }}/100
              </p>
              <ProgressBar
                  :value="healthData?.health_score || 0"
                  :showValue="false"
                  :class="{
                  'text-green-500': healthData?.status === 'healthy',
                  'text-yellow-500': healthData?.status === 'watch',
                  'text-red-500': healthData?.status === 'critical'
                }"
              />
              <p class="text-xs text-gray-500 mt-2">{{ getHealthLabel }}</p>
            </div>

            <!-- NDVI Value -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">NDVI Value</p>
              <p :class="['text-3xl font-bold mb-2', getHealthColor]">
                {{ healthData?.ndvi_value?.toFixed(3) || '0.000' }}
              </p>
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                    class="h-2 rounded-full transition-all"
                    :class="{
                    'bg-green-500': healthData?.ndvi_value >= 0.7,
                    'bg-yellow-500': healthData?.ndvi_value >= 0.5 && healthData?.ndvi_value < 0.7,
                    'bg-red-500': healthData?.ndvi_value < 0.5
                  }"
                    :style="{ width: `${(healthData?.ndvi_value || 0) * 100}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500">
                {{ getNDVIInterpretation(healthData?.ndvi_value || 0) }}
              </p>
            </div>

            <!-- Status Badge -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">Overall Status</p>
              <div
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  :class="getHealthBgColor"
              >
                <i
                    class="pi text-xl"
                    :class="{
                    'pi-check-circle text-green-600': healthData?.status === 'healthy',
                    'pi-exclamation-triangle text-yellow-600': healthData?.status === 'watch',
                    'pi-times-circle text-red-600': healthData?.status === 'critical'
                  }"
                ></i>
                <span :class="['font-bold', getHealthColor]">
                  {{ getHealthLabel }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-3">
                Based on satellite imagery from Sentinel-2
              </p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Historical Trends Chart -->
    <Card v-if="chartData">
      <template #title>
        <h3 class="text-lg font-bold text-gray-800">Health Trends (Last 90 Days)</h3>
      </template>
      <template #content>
        <div class="h-80">
          <Chart type="line" :data="chartData" :options="chartOptions" />
        </div>
      </template>
    </Card>

    <!-- NDVI Explanation -->
    <Card>
      <template #title>
        <h3 class="text-lg font-bold text-gray-800">Understanding NDVI</h3>
      </template>
      <template #content>
        <div class="space-y-3">
          <p class="text-gray-700">
            NDVI (Normalized Difference Vegetation Index) measures plant health using satellite imagery.
            It ranges from -1 to +1, where higher values indicate healthier, denser vegetation.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="font-semibold text-red-700 text-sm">-1.0 to 0.2</p>
              <p class="text-xs text-gray-600 mt-1">Bare soil, water, or stressed crops</p>
            </div>
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="font-semibold text-yellow-700 text-sm">0.2 to 0.5</p>
              <p class="text-xs text-gray-600 mt-1">Sparse vegetation or unhealthy crops</p>
            </div>
            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="font-semibold text-green-700 text-sm">0.5 to 0.7</p>
              <p class="text-xs text-gray-600 mt-1">Moderate, healthy vegetation</p>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p class="font-semibold text-emerald-700 text-sm">0.7 to 1.0</p>
              <p class="text-xs text-gray-600 mt-1">Dense, very healthy vegetation</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- No Data Message -->
    <Card v-if="!healthData" class="text-center py-8">
      <template #content>
        <i class="pi pi-info-circle text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-700 mb-2">No Health Data Available</h3>
        <p class="text-gray-600 mb-4">Satellite data is being processed for this farm</p>
        <Button
            label="Refresh Data"
            icon="pi pi-refresh"
            @click="emit('refresh')"
        />
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-progressbar) {
  height: 8px;
  border-radius: 4px;
}

:deep(.p-chart) {
  height: 100%;
}
</style>