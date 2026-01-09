<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useFarmsStore } from '@/stores/farms'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'

const router = useRouter()
const alertsStore = useAlertsStore()
const farmsStore = useFarmsStore()

const searchQuery = ref('')
const selectedPriority = ref('all')
const showResolved = ref(false)
const selectedAlerts = ref([])

const priorityOptions = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' }
]

const filteredAlerts = computed(() => {
  let alerts = alertsStore.alerts

  // Filter by resolved status
  if (!showResolved.value) {
    alerts = alerts.filter(a => !a.resolved)
  }

  // Filter by priority
  if (selectedPriority.value !== 'all') {
    alerts = alerts.filter(a => a.priority === selectedPriority.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    alerts = alerts.filter(a => {
      const farm = farmsStore.getFarmById(a.farmId)
      const farmName = farm ? farm.name : ''
      const farmOwner = farm ? farm.owner : ''

      return (
          a.title.toLowerCase().includes(query) ||
          a.message.toLowerCase().includes(query) ||
          farmName.toLowerCase().includes(query) ||
          farmOwner.toLowerCase().includes(query)
      )
    })
  }

  // Sort by priority and timestamp
  return alerts.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.timestamp) - new Date(a.timestamp)
  })
})

const alertsByPriority = computed(() => {
  return {
    critical: filteredAlerts.value.filter(a => a.priority === 'critical' && !a.resolved),
    high: filteredAlerts.value.filter(a => a.priority === 'high' && !a.resolved),
    medium: filteredAlerts.value.filter(a => a.priority === 'medium' && !a.resolved)
  }
})

const unreadCount = computed(() => {
  return alertsStore.alerts.filter(a => !a.read && !a.resolved).length
})

const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'pi-exclamation-circle',
    high: 'pi-exclamation-triangle',
    medium: 'pi-info-circle'
  }
  return icons[priority] || 'pi-info-circle'
}

const getPrioritySeverity = (priority) => {
  const severities = {
    critical: 'danger',
    high: 'warning',
    medium: 'info'
  }
  return severities[priority] || 'info'
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50'
  }
  return colors[priority] || 'border-gray-500 bg-gray-50'
}

const getFarmName = (farmId) => {
  const farm = farmsStore.getFarmById(farmId)
  return farm ? farm.name : 'Unknown Farm'
}

const getFarmOwner = (farmId) => {
  const farm = farmsStore.getFarmById(farmId)
  return farm ? farm.owner : 'Unknown Owner'
}

const getTimeAgo = (timestamp) => {
  const now = new Date()
  const alertTime = new Date(timestamp)
  const diffMs = now - alertTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return alertTime.toLocaleDateString()
}

const handleAlertClick = (alert) => {
  alertsStore.markAsRead(alert.id)
  router.push(`/farms/${alert.farmId}`)
}

const handleResolve = (alertId, event) => {
  event.stopPropagation()
  alertsStore.markAsResolved(alertId)
}

const handleBulkResolve = () => {
  if (selectedAlerts.value.length === 0) return

  if (confirm(`Resolve ${selectedAlerts.value.length} selected alert(s)?`)) {
    selectedAlerts.value.forEach(alertId => {
      alertsStore.markAsResolved(alertId)
    })
    selectedAlerts.value = []
  }
}

const selectAllCritical = () => {
  selectedAlerts.value = alertsByPriority.value.critical.map(a => a.id)
}

const clearSelection = () => {
  selectedAlerts.value = []
}

const markAllAsRead = () => {
  filteredAlerts.value.forEach(alert => {
    if (!alert.read) {
      alertsStore.markAsRead(alert.id)
    }
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedPriority.value = 'all'
  showResolved.value = false
}

onMounted(() => {
  alertsStore.fetchAlerts()
  farmsStore.fetchFarms()
})
</script>

<template>
  <div class="alerts-list-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-3">
          <i class="pi pi-bell text-3xl text-orange-500"></i>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Alerts</h1>
            <p class="text-gray-600">Monitor and manage farm alerts</p>
          </div>
          <Badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              severity="danger"
              size="large"
          />
        </div>

        <div class="flex gap-2">
          <Button
              label="Mark All Read"
              icon="pi pi-check"
              severity="secondary"
              outlined
              size="small"
              @click="markAllAsRead"
              :disabled="unreadCount === 0"
          />
          <Button
              label="Refresh"
              icon="pi pi-refresh"
              outlined
              size="small"
              @click="alertsStore.fetchAlerts()"
          />
        </div>
      </div>

      <!-- Filters -->
      <Card>
        <template #content>
          <div class="flex flex-wrap gap-4 items-center">
            <!-- Search -->
            <div class="flex-1 min-w-[200px]">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText
                    v-model="searchQuery"
                    placeholder="Search alerts, farms..."
                    class="w-full"
                />
              </span>
            </div>

            <!-- Priority Filter -->
            <Dropdown
                v-model="selectedPriority"
                :options="priorityOptions"
                optionLabel="label"
                optionValue="value"
                class="w-48"
            />

            <!-- Show Resolved -->
            <div class="flex items-center gap-2">
              <Checkbox
                  v-model="showResolved"
                  :binary="true"
                  inputId="showResolved"
              />
              <label for="showResolved" class="cursor-pointer">Show Resolved</label>
            </div>

            <!-- Reset -->
            <Button
                icon="pi pi-filter-slash"
                label="Reset"
                severity="secondary"
                outlined
                size="small"
                @click="resetFilters"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedAlerts.length > 0" class="mb-4">
      <Card class="bg-blue-50 border border-blue-200">
        <template #content>
          <div class="flex items-center justify-between">
            <span class="font-semibold text-blue-800">
              {{ selectedAlerts.length }} alert(s) selected
            </span>
            <div class="flex gap-2">
              <Button
                  label="Resolve Selected"
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  @click="handleBulkResolve"
              />
              <Button
                  label="Clear Selection"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="clearSelection"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div v-if="alertsByPriority.critical.length > 0" class="mb-4">
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-circle text-red-600 text-xl"></i>
              <span class="font-semibold text-red-800">
                {{ alertsByPriority.critical.length }} critical alert(s) require immediate attention
              </span>
            </div>
            <Button
                label="Select All Critical"
                icon="pi pi-check-square"
                severity="danger"
                outlined
                size="small"
                @click="selectAllCritical"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Alerts List -->
    <div class="space-y-4">
      <!-- Critical Alerts -->
      <div v-if="alertsByPriority.critical.length > 0 && !showResolved">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <h2 class="text-xl font-bold text-gray-800">
            CRITICAL ({{ alertsByPriority.critical.length }})
          </h2>
        </div>

        <div class="space-y-3">
          <Card
              v-for="alert in alertsByPriority.critical"
              :key="alert.id"
              :class="[
              'cursor-pointer transition-all hover:shadow-lg border-l-4',
              getPriorityColor(alert.priority),
              !alert.read ? 'ring-2 ring-red-200' : ''
            ]"
              @click="handleAlertClick(alert)"
          >
            <template #content>
              <div class="flex gap-4">
                <!-- Checkbox -->
                <div class="flex items-start pt-1">
                  <Checkbox
                      v-model="selectedAlerts"
                      :value="alert.id"
                      @click.stop
                  />
                </div>

                <!-- Icon -->
                <div class="flex-shrink-0 pt-1">
                  <i :class="['pi', getPriorityIcon(alert.priority), 'text-2xl text-red-600']"></i>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-gray-800 mb-1">
                        {{ getFarmName(alert.farmId) }}
                      </h3>
                      <p class="text-sm text-gray-600 mb-1">{{ getFarmOwner(alert.farmId) }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <Tag
                          :value="alert.priority.toUpperCase()"
                          :severity="getPrioritySeverity(alert.priority)"
                      />
                      <span class="text-xs text-gray-500">{{ getTimeAgo(alert.timestamp) }}</span>
                      <Badge v-if="!alert.read" value="NEW" severity="info" size="small" />
                    </div>
                  </div>

                  <p class="text-red-700 font-semibold mb-2">{{ alert.title }}</p>
                  <p class="text-gray-700 text-sm mb-3">{{ alert.message }}</p>

                  <div class="flex gap-2">
                    <Button
                        label="View Farm"
                        icon="pi pi-arrow-right"
                        severity="danger"
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
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- High Priority Alerts -->
      <div v-if="alertsByPriority.high.length > 0 && !showResolved">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full bg-orange-500"></div>
          <h2 class="text-xl font-bold text-gray-800">
            HIGH PRIORITY ({{ alertsByPriority.high.length }})
          </h2>
        </div>

        <div class="space-y-3">
          <Card
              v-for="alert in alertsByPriority.high"
              :key="alert.id"
              :class="[
              'cursor-pointer transition-all hover:shadow-lg border-l-4',
              getPriorityColor(alert.priority),
              !alert.read ? 'ring-2 ring-orange-200' : ''
            ]"
              @click="handleAlertClick(alert)"
          >
            <template #content>
              <div class="flex gap-4">
                <div class="flex items-start pt-1">
                  <Checkbox
                      v-model="selectedAlerts"
                      :value="alert.id"
                      @click.stop
                  />
                </div>

                <div class="flex-shrink-0 pt-1">
                  <i :class="['pi', getPriorityIcon(alert.priority), 'text-2xl text-orange-600']"></i>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-gray-800 mb-1">
                        {{ getFarmName(alert.farmId) }}
                      </h3>
                      <p class="text-sm text-gray-600 mb-1">{{ getFarmOwner(alert.farmId) }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <Tag
                          :value="alert.priority.toUpperCase()"
                          :severity="getPrioritySeverity(alert.priority)"
                      />
                      <span class="text-xs text-gray-500">{{ getTimeAgo(alert.timestamp) }}</span>
                      <Badge v-if="!alert.read" value="NEW" severity="info" size="small" />
                    </div>
                  </div>

                  <p class="text-orange-700 font-semibold mb-2">{{ alert.title }}</p>
                  <p class="text-gray-700 text-sm mb-3">{{ alert.message }}</p>

                  <div class="flex gap-2">
                    <Button
                        label="View Farm"
                        icon="pi pi-arrow-right"
                        severity="warning"
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
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Medium Priority Alerts -->
      <div v-if="alertsByPriority.medium.length > 0 && !showResolved">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <h2 class="text-xl font-bold text-gray-800">
            MEDIUM PRIORITY ({{ alertsByPriority.medium.length }})
          </h2>
        </div>

        <div class="space-y-3">
          <Card
              v-for="alert in alertsByPriority.medium"
              :key="alert.id"
              :class="[
              'cursor-pointer transition-all hover:shadow-lg border-l-4',
              getPriorityColor(alert.priority),
              !alert.read ? 'ring-2 ring-yellow-200' : ''
            ]"
              @click="handleAlertClick(alert)"
          >
            <template #content>
              <div class="flex gap-4">
                <div class="flex items-start pt-1">
                  <Checkbox
                      v-model="selectedAlerts"
                      :value="alert.id"
                      @click.stop
                  />
                </div>

                <div class="flex-shrink-0 pt-1">
                  <i :class="['pi', getPriorityIcon(alert.priority), 'text-2xl text-yellow-600']"></i>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-gray-800 mb-1">
                        {{ getFarmName(alert.farmId) }}
                      </h3>
                      <p class="text-sm text-gray-600 mb-1">{{ getFarmOwner(alert.farmId) }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <Tag
                          :value="alert.priority.toUpperCase()"
                          :severity="getPrioritySeverity(alert.priority)"
                      />
                      <span class="text-xs text-gray-500">{{ getTimeAgo(alert.timestamp) }}</span>
                      <Badge v-if="!alert.read" value="NEW" severity="info" size="small" />
                    </div>
                  </div>

                  <p class="text-yellow-700 font-semibold mb-2">{{ alert.title }}</p>
                  <p class="text-gray-700 text-sm mb-3">{{ alert.message }}</p>

                  <div class="flex gap-2">
                    <Button
                        label="View Farm"
                        icon="pi pi-arrow-right"
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
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Resolved Alerts -->
      <div v-if="showResolved && filteredAlerts.filter(a => a.resolved).length > 0">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <h2 class="text-xl font-bold text-gray-800">
            RESOLVED ({{ filteredAlerts.filter(a => a.resolved).length }})
          </h2>
        </div>

        <div class="space-y-3">
          <Card
              v-for="alert in filteredAlerts.filter(a => a.resolved)"
              :key="alert.id"
              class="opacity-75 border-l-4 border-green-500"
          >
            <template #content>
              <div class="flex gap-4">
                <div class="flex-shrink-0 pt-1">
                  <i class="pi pi-check-circle text-2xl text-green-600"></i>
                </div>

                <div class="flex-1">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 class="font-bold text-lg text-gray-800 mb-1">
                        {{ getFarmName(alert.farmId) }}
                      </h3>
                      <p class="text-sm text-gray-600">{{ getFarmOwner(alert.farmId) }}</p>
                    </div>
                    <Tag value="RESOLVED" severity="success" />
                  </div>

                  <p class="text-gray-700 font-semibold mb-1 line-through">{{ alert.title }}</p>
                  <p class="text-gray-600 text-sm line-through">{{ alert.message }}</p>
                  <span class="text-xs text-gray-500 mt-2 inline-block">
                    Resolved {{ getTimeAgo(alert.resolvedAt) }}
                  </span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Empty State -->
      <Card v-if="filteredAlerts.length === 0" class="text-center py-12">
        <template #content>
          <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
          <h3 class="text-2xl font-bold text-gray-700 mb-2">
            {{ showResolved ? 'No Resolved Alerts' : 'No Active Alerts' }}
          </h3>
          <p class="text-gray-600 mb-4">
            {{ showResolved ? 'Resolved alerts will appear here' : 'All farms are in good condition!' }}
          </p>
          <Button
              v-if="searchQuery || selectedPriority !== 'all'"
              label="Clear Filters"
              icon="pi pi-filter-slash"
              outlined
              @click="resetFilters"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.alerts-list-page {
  max-width: 1200px;
  margin: 0 auto;
}

:deep(.p-card) {
  transition: all 0.2s;
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
}
</style>