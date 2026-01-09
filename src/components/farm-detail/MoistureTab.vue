<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'

const props = defineProps({
  farm: {
    type: Object,
    required: true
  },
  moistureData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['refresh'])

// Moisture status helpers
const getMoistureColor = computed(() => {
  const status = props.moistureData?.status
  if (status === 'wet') return 'text-blue-600'
  if (status === 'adequate') return 'text-green-600'
  if (status === 'low') return 'text-orange-600'
  return 'text-red-600'
})

const getMoistureBgColor = computed(() => {
  const status = props.moistureData?.status
  if (status === 'wet') return 'bg-blue-50 border-blue-200'
  if (status === 'adequate') return 'bg-green-50 border-green-200'
  if (status === 'low') return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
})

const getMoistureLabel = computed(() => {
  const status = props.moistureData?.status
  if (status === 'wet') return 'Wet - Good'
  if (status === 'adequate') return 'Adequate'
  if (status === 'low') return 'Low - Monitor'
  return 'Dry - Urgent'
})

const getMoistureIcon = computed(() => {
  const status = props.moistureData?.status
  if (status === 'wet') return 'pi-cloud'
  if (status === 'adequate') return 'pi-check-circle'
  if (status === 'low') return 'pi-exclamation-triangle'
  return 'pi-times-circle'
})

const getIrrigationRecommendation = computed(() => {
  const status = props.moistureData?.status
  const percent = props.moistureData?.moisture_percent || 0

  if (status === 'dry' || percent < 30) {
    return {
      urgent: true,
      message: 'Immediate irrigation required',
      action: 'Water crops within 24 hours'
    }
  } else if (status === 'low' || percent < 50) {
    return {
      urgent: false,
      message: 'Plan irrigation soon',
      action: 'Schedule watering within 2-3 days'
    }
  } else if (status === 'adequate') {
    return {
      urgent: false,
      message: 'No irrigation needed',
      action: 'Continue monitoring'
    }
  } else {
    return {
      urgent: false,
      message: 'Excellent moisture levels',
      action: 'No action required'
    }
  }
})

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
    <!-- Current Moisture Status Card -->
    <Card :class="['border-l-4', getMoistureBgColor]">
      <template #content>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-1">Current Soil Moisture</h3>
              <p class="text-sm text-gray-600">
                Last updated: {{ formatDate(moistureData?.date) }}
              </p>
            </div>
            <Button
                icon="pi pi-refresh"
                rounded
                text
                @click="emit('refresh')"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Moisture Percentage -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">Moisture Level</p>
              <p :class="['text-3xl font-bold mb-2', getMoistureColor]">
                {{ moistureData?.moisture_percent?.toFixed(1) || 0 }}%
              </p>
              <ProgressBar
                  :value="moistureData?.moisture_percent || 0"
                  :showValue="false"
              />
              <p class="text-xs text-gray-500 mt-2">{{ getMoistureLabel }}</p>
            </div>

            <!-- Days Since Rain -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">Days Since Rain</p>
              <p class="text-3xl font-bold text-gray-800 mb-2">
                {{ moistureData?.days_since_rain || 0 }}
              </p>
              <div class="flex items-center gap-2 text-xs text-gray-600">
                <i class="pi pi-calendar"></i>
                <span>Last rainfall tracking</span>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="bg-white p-4 rounded-lg border">
              <p class="text-sm text-gray-600 mb-2">Irrigation Status</p>
              <div
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  :class="getMoistureBgColor"
              >
                <i
                    class="pi text-xl"
                    :class="[getMoistureIcon, getMoistureColor]"
                ></i>
                <span :class="['font-bold', getMoistureColor]">
                  {{ getMoistureLabel }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Irrigation Recommendation -->
    <Card :class="['border-l-4', getIrrigationRecommendation.urgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50']">
      <template #content>
        <div class="flex items-start gap-4">
          <i
              :class="[
              'pi text-4xl',
              getIrrigationRecommendation.urgent ? 'pi-exclamation-circle text-red-600' : 'pi-info-circle text-blue-600'
            ]"
          ></i>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-800 mb-2">
              {{ getIrrigationRecommendation.message }}
            </h3>
            <p class="text-gray-700 mb-3">
              {{ getIrrigationRecommendation.action }}
            </p>
            <div v-if="getIrrigationRecommendation.urgent" class="flex gap-2">
              <Button
                  label="Schedule Irrigation"
                  icon="pi pi-calendar-plus"
                  severity="danger"
                  size="small"
              />
              <Button
                  label="View Forecast"
                  icon="pi pi-cloud"
                  severity="secondary"
                  outlined
                  size="small"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Moisture Levels Guide -->
    <Card>
      <template #title>
        <h3 class="text-lg font-bold text-gray-800">Soil Moisture Levels</h3>
      </template>
      <template #content>
        <div class="space-y-3">
          <p class="text-gray-700 mb-4">
            Optimal soil moisture varies by crop type. Here's a general guide for {{ farm.crop_type || 'your crop' }}:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-times-circle text-red-600"></i>
                <p class="font-semibold text-red-700 text-sm">Dry (0-30%)</p>
              </div>
              <p class="text-xs text-gray-600">Immediate irrigation needed. Crops under stress.</p>
            </div>

            <div class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-exclamation-triangle text-orange-600"></i>
                <p class="font-semibold text-orange-700 text-sm">Low (30-50%)</p>
              </div>
              <p class="text-xs text-gray-600">Plan irrigation soon. Monitor closely.</p>
            </div>

            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-check-circle text-green-600"></i>
                <p class="font-semibold text-green-700 text-sm">Adequate (50-70%)</p>
              </div>
              <p class="text-xs text-gray-600">Optimal for most crops. Good condition.</p>
            </div>

            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-cloud text-blue-600"></i>
                <p class="font-semibold text-blue-700 text-sm">Wet (70-100%)</p>
              </div>
              <p class="text-xs text-gray-600">Excellent moisture. Monitor for excess.</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Farm-Specific Info -->
    <Card>
      <template #title>
        <h3 class="text-lg font-bold text-gray-800">Farm Information</h3>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Irrigation Type</p>
            <p class="font-semibold text-gray-800">{{ farm.irrigation || 'Not specified' }}</p>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Soil Type</p>
            <p class="font-semibold text-gray-800">{{ farm.soil_type || 'Not specified' }}</p>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Crop Type</p>
            <p class="font-semibold text-gray-800">{{ farm.crop_type || 'Not specified' }}</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- No Data Message -->
    <Card v-if="!moistureData" class="text-center py-8">
      <template #content>
        <i class="pi pi-info-circle text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-700 mb-2">No Moisture Data Available</h3>
        <p class="text-gray-600 mb-4">Soil moisture data is being collected</p>
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
</style>