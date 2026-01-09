<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
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
  moistureData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['action'])

// Generate smart recommendations based on farm data
const recommendations = computed(() => {
  const recs = []

  // Health-based recommendations
  if (props.healthData) {
    if (props.healthData.status === 'critical') {
      recs.push({
        priority: 'critical',
        title: 'Crop Health Critical',
        icon: 'pi-exclamation-circle',
        message: `NDVI value of ${props.healthData.ndvi_value?.toFixed(3)} indicates severe crop stress.`,
        actions: [
          'Conduct immediate field inspection',
          'Check for pest infestation or disease',
          'Test soil nutrient levels',
          'Consider emergency fertilizer application'
        ],
        color: 'red'
      })
    } else if (props.healthData.status === 'watch') {
      recs.push({
        priority: 'high',
        title: 'Monitor Crop Health',
        icon: 'pi-exclamation-triangle',
        message: `NDVI value of ${props.healthData.ndvi_value?.toFixed(3)} shows crops need attention.`,
        actions: [
          'Schedule field inspection this week',
          'Review fertilization schedule',
          'Monitor for pest activity',
          'Ensure adequate irrigation'
        ],
        color: 'yellow'
      })
    } else {
      recs.push({
        priority: 'low',
        title: 'Healthy Crops',
        icon: 'pi-check-circle',
        message: `NDVI value of ${props.healthData.ndvi_value?.toFixed(3)} indicates good crop health.`,
        actions: [
          'Continue current management practices',
          'Maintain regular monitoring schedule',
          'Document successful practices'
        ],
        color: 'green'
      })
    }
  }

  // Moisture-based recommendations
  if (props.moistureData) {
    if (props.moistureData.status === 'dry') {
      recs.push({
        priority: 'critical',
        title: 'Irrigation Urgently Needed',
        icon: 'pi-exclamation-circle',
        message: `Soil moisture at ${props.moistureData.moisture_percent?.toFixed(1)}% is critically low.`,
        actions: [
          'Irrigate immediately (within 24 hours)',
          'Apply water deeply to reach root zone',
          'Monitor soil moisture daily',
          'Check irrigation system functionality'
        ],
        color: 'red'
      })
    } else if (props.moistureData.status === 'low') {
      recs.push({
        priority: 'high',
        title: 'Plan Irrigation',
        icon: 'pi-exclamation-triangle',
        message: `Soil moisture at ${props.moistureData.moisture_percent?.toFixed(1)}% is below optimal.`,
        actions: [
          'Schedule irrigation within 2-3 days',
          'Prepare irrigation equipment',
          'Monitor weather forecast',
          'Check soil moisture levels regularly'
        ],
        color: 'orange'
      })
    }
  }

  // Crop-specific recommendations
  const cropType = props.farm.crop_type?.toLowerCase()
  if (cropType) {
    if (cropType === 'maize') {
      recs.push({
        priority: 'medium',
        title: 'Maize Management',
        icon: 'pi-info-circle',
        message: 'Recommended practices for maize cultivation in this region.',
        actions: [
          'Apply top-dressing fertilizer at 4-6 weeks after planting',
          'Control weeds through timely weeding or herbicide use',
          'Monitor for fall armyworm and apply appropriate control',
          'Ensure adequate spacing for optimal yield'
        ],
        color: 'blue'
      })
    } else if (cropType === 'sugarcane') {
      recs.push({
        priority: 'medium',
        title: 'Sugarcane Management',
        icon: 'pi-info-circle',
        message: 'Best practices for sugarcane in your area.',
        actions: [
          'Maintain consistent soil moisture levels',
          'Apply nitrogen fertilizer during active growth',
          'Control pests like sugarcane borers',
          'Plan for harvest 12-18 months after planting'
        ],
        color: 'blue'
      })
    }
  }

  return recs.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
})

const getPriorityBadgeClass = (priority) => {
  const classes = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  }
  return classes[priority] || classes.medium
}

const getCardBorderClass = (color) => {
  const classes = {
    red: 'border-red-500 bg-red-50',
    orange: 'border-orange-500 bg-orange-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50'
  }
  return classes[color] || classes.blue
}

const getIconClass = (color) => {
  const classes = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    green: 'text-green-600'
  }
  return classes[color] || classes.blue
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Smart Recommendations</h2>
        <p class="text-sm text-gray-600">AI-powered farming advice based on satellite data</p>
      </div>
      <Button
          label="Generate Report"
          icon="pi pi-file-pdf"
          severity="secondary"
          outlined
          size="small"
      />
    </div>

    <!-- Recommendations List -->
    <div v-for="(rec, index) in recommendations" :key="index" class="space-y-4">
      <Card :class="['border-l-4', getCardBorderClass(rec.color)]">
        <template #content>
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1">
                <i :class="['pi text-3xl', rec.icon, getIconClass(rec.color)]"></i>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="text-lg font-bold text-gray-800">{{ rec.title }}</h3>
                    <span
                        :class="['px-2 py-1 rounded-full text-xs font-semibold border', getPriorityBadgeClass(rec.priority)]"
                    >
                      {{ rec.priority.toUpperCase() }}
                    </span>
                  </div>
                  <p class="text-gray-700 text-sm">{{ rec.message }}</p>
                </div>
              </div>
            </div>

            <!-- Action Items -->
            <div class="bg-white rounded-lg p-4 border">
              <p class="text-sm font-semibold text-gray-800 mb-3">Recommended Actions:</p>
              <ul class="space-y-2">
                <li
                    v-for="(action, idx) in rec.actions"
                    :key="idx"
                    class="flex items-start gap-2 text-sm text-gray-700"
                >
                  <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <Button
                  label="Mark as Done"
                  icon="pi pi-check"
                  :severity="rec.priority === 'critical' ? 'danger' : (rec.priority === 'high' ? 'warning' : 'secondary')"
                  outlined
                  size="small"
                  @click="emit('action', { type: 'complete', rec })"
              />
              <Button
                  label="Schedule Reminder"
                  icon="pi pi-calendar"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="emit('action', { type: 'schedule', rec })"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- No Recommendations -->
    <Card v-if="recommendations.length === 0" class="text-center py-8">
      <template #content>
        <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-700 mb-2">All Good!</h3>
        <p class="text-gray-600">No urgent recommendations at this time. Continue monitoring your farm.</p>
      </template>
    </Card>

    <!-- General Tips -->
    <Card class="bg-gradient-to-r from-purple-50 to-blue-50">
      <template #content>
        <div class="flex items-start gap-4">
          <i class="pi pi-lightbulb text-3xl text-purple-600"></i>
          <div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Farming Tips</h3>
            <ul class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <i class="pi pi-angle-right text-purple-600 mt-1"></i>
                <span>Check satellite data weekly to catch problems early</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-angle-right text-purple-600 mt-1"></i>
                <span>Keep detailed records of all farm activities and inputs</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-angle-right text-purple-600 mt-1"></i>
                <span>Plan activities based on weather forecasts</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-angle-right text-purple-600 mt-1"></i>
                <span>Consult local agricultural extension officers for advice</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>