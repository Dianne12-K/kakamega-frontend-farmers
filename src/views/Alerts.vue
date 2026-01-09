<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useFarmsStore } from '@/stores/farms'

import Card from 'primevue/card'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'

const router = useRouter()
const alertsStore = useAlertsStore()
const farmsStore = useFarmsStore()

// Filter options
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Resolved', value: 'resolved' }
]

const selectedFilter = ref('all')

// Filtered alerts
const filteredAlerts = computed(() => {
  if (selectedFilter.value === 'all') {
    return alertsStore.alerts.filter(a => !a.resolved)
  } else if (selectedFilter.value === 'resolved') {
    return alertsStore.alerts.filter(a => a.resolved)
  } else {
    return alertsStore.alerts.filter(a =>
        a.priority === selectedFilter.value && !a.resolved
    )
  }
})

// Alerts grouped by priority
const alertsByPriority = computed(() => {
  const grouped = { critical: [], high: [], medium: [] }
  filteredAlerts.value.forEach(alert => {
    if (!alert.resolved && grouped[alert.priority]) {
      grouped[alert.priority].push(alert)
    }
  })
  return grouped
})

// Resolved alerts
const resolvedAlerts = computed(() =>
    alertsStore.alerts.filter(a => a.resolved)
)

// Helpers for UI
const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'pi-exclamation-circle',
    high: 'pi-exclamation-triangle',
    medium: 'pi-info-circle'
  }
  return icons[priority] || 'pi-info-circle'
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }
  return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200'
}

const getPriorityBadgeColor = (priority) => {
  const colors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500'
  }
  return colors[priority] || 'bg-gray-500'
}

const getFarmName = (farmId) => {
  const farm = farmsStore.getFarmById(farmId)
  return farm ? `${farm.name} - ${farm.owner}` : 'Unknown Farm'
}

const getTimeAgo = (timestamp) => {
  if (!timestamp) return ''
  const now = new Date()
  const alertTime = new Date(timestamp)
  const diffMs = now - alertTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
}

// Handle clicks
const handleAlertClick = (alert) => {
  alertsStore.markAsRead(alert.id)
  router.push(`/farms/${alert.farmId}`)
}

const handleResolve = (alertId, event) => {
  event.stopPropagation()
  const alert = alertsStore.alerts.find(a => a.id === alertId)
  if (alert && !alert.resolved) {
    alertsStore.markAsResolved(alertId)
    alert.resolvedAt = new Date() // store resolution time
  }
}

// On mount: fetch farms, then generate alerts
onMounted(async () => {
  await farmsStore.fetchFarms()
  alertsStore.generateAlerts(farmsStore.farms)
})
</script>

<template>
  <div class="alerts-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="pi pi-bell text-3xl text-orange-500"></i>
        <h1 class="text-3xl font-bold text-gray-800">Alerts & Priority Actions</h1>
      </div>
      <p class="text-gray-600">Monitor and respond to farm alerts across your region</p>
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

    <!-- Alerts List -->
    <div v-if="selectedFilter !== 'resolved'" class="space-y-6">
      <template v-for="priority in ['critical','high','medium']">
        <div v-if="alertsByPriority[priority].length">
          <div class="flex items-center gap-2 mb-4">
            <div :class="['w-3 h-3 rounded-full', getPriorityBadgeColor(priority)]"></div>
            <h2 class="text-xl font-bold text-gray-800">
              {{ priority.toUpperCase() }} ({{ alertsByPriority[priority].length }})
            </h2>
          </div>

          <div class="space-y-3">
            <Card
                v-for="alert in alertsByPriority[priority]"
                :key="alert.id"
                class="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                :class="{
                'border-red-500': priority==='critical',
                'border-orange-500': priority==='high',
                'border-yellow-500': priority==='medium'
              }"
                @click="handleAlertClick(alert)"
            >
              <template #content>
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-start gap-3">
                      <i :class="['pi', getPriorityIcon(alert.priority), 'text-2xl mt-1', {
                        'text-red-600': priority==='critical',
                        'text-orange-600': priority==='high',
                        'text-yellow-600': priority==='medium'
                      }]"></i>
                      <div class="flex-1">
                        <h3 class="font-bold text-lg text-gray-800 mb-1">{{ getFarmName(alert.farmId) }}</h3>
                        <p :class="{'text-red-700': priority==='critical','text-orange-700': priority==='high','text-yellow-700': priority==='medium'}" class="font-semibold mb-2">{{ alert.title }}</p>
                        <p class="text-gray-600 text-sm">{{ alert.message }}</p>
                        <span class="text-xs text-gray-500 mt-2 inline-block">{{ getTimeAgo(alert.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button
                        label="View Farm"
                        icon="pi pi-arrow-right"
                        :severity="priority==='critical' ? 'danger' : (priority==='high' ? 'warning' : 'info')"
                        size="small"
                    />
                    <Button
                        label="Resolve"
                        icon="pi pi-check"
                        severity="success"
                        outlined
                        size="small"
                        @click="handleResolve(alert.id, $event)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </template>

      <!-- No Alerts Message -->
      <Card v-if="filteredAlerts.length === 0" class="text-center py-8">
        <template #content>
          <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
          <h3 class="text-xl font-bold text-gray-700 mb-2">No Active Alerts</h3>
          <p class="text-gray-600">All farms are in good condition!</p>
        </template>
      </Card>
    </div>

    <!-- Resolved Alerts Section -->
    <div v-if="selectedFilter === 'resolved'">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-3 h-3 rounded-full bg-green-500"></div>
        <h2 class="text-xl font-bold text-gray-800">
          RESOLVED ({{ resolvedAlerts.length }})
        </h2>
      </div>

      <div v-if="resolvedAlerts.length > 0" class="space-y-3">
        <Card
            v-for="alert in resolvedAlerts"
            :key="alert.id"
            class="opacity-75 border-l-4 border-green-500"
        >
          <template #content>
            <div class="flex items-start gap-3">
              <i class="pi pi-check-circle text-2xl text-green-600 mt-1"></i>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-gray-800 mb-1">{{ getFarmName(alert.farmId) }}</h3>
                <p class="text-gray-700 font-semibold mb-2">{{ alert.title }}</p>
                <p class="text-gray-600 text-sm line-through">{{ alert.message }}</p>
                <span class="text-xs text-gray-500 mt-2 inline-block">
                  Resolved {{ getTimeAgo(alert.resolvedAt) }}
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card v-else class="text-center py-8">
        <template #content>
          <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-bold text-gray-700 mb-2">No Resolved Alerts</h3>
          <p class="text-gray-600">Resolved alerts will appear here</p>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  max-width: 1200px;
  margin: 0 auto;
}
:deep(.p-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
:deep(.p-card:hover) {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
