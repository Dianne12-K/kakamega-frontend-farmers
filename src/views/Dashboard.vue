<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore }     from '@/stores/farms'
import { useAlertsStore }    from '@/stores/alerts'
import { useAnalyticsStore } from '@/stores/analytics'
import { useSatelliteStore } from '@/stores/satellite'

import Card      from 'primevue/card'
import Button    from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column    from 'primevue/column'
import Skeleton  from 'primevue/skeleton'
import Tag       from 'primevue/tag'

import FarmMap          from '@/components/FarmMap.vue'
import StatsCards       from '@/components/StatsCards.vue'
import WeatherWidget    from '@/components/WeatherWidget.vue'

const router          = useRouter()
const farmsStore      = useFarmsStore()
const alertsStore     = useAlertsStore()
const analyticsStore  = useAnalyticsStore()
const satelliteStore  = useSatelliteStore()

const selectedFarm = ref(null)

/* ── Alerts ──────────────────────────────────────────────── */
const priorityAlerts = computed(() => [
  ...alertsStore.criticalAlerts.slice(0, 2),
  ...alertsStore.highAlerts.slice(0, 3)
].slice(0, 5))

/* ── System Status (from real API) ──────────────────────── */
const coveragePercent = computed(() =>
    analyticsStore.platformKPIs?.monitoring_rate_pct ?? null
)

const avgHealthScore = computed(() =>
    analyticsStore.platformKPIs?.avg_health_score ?? null
)

const lastUpdateLabel = computed(() => {
  if (!analyticsStore.platformKPIs) return '—'
  // Use current time as proxy for "just loaded"
  const now = new Date()
  return now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
})

const healthStatusLabel = computed(() => {
  const score = avgHealthScore.value
  if (score === null) return { label: '—', cls: 'text-gray-400' }
  if (score >= 70)    return { label: 'Good',     cls: 'text-green-600' }
  if (score >= 40)    return { label: 'Fair',      cls: 'text-yellow-600' }
  return               { label: 'Needs Attention', cls: 'text-red-600' }
})

/* ── Health Overview Chart Data ─────────────────────────── */
const healthBars = computed(() => {
  const h = analyticsStore.healthOverview?.health_overview
  if (!h) return []
  return [
    { label: 'Healthy',  count: h.healthy?.count  ?? 0, pct: h.healthy?.percent  ?? 0, color: 'bg-green-500'  },
    { label: 'Watch',    count: h.watch?.count    ?? 0, pct: h.watch?.percent    ?? 0, color: 'bg-yellow-500' },
    { label: 'Critical', count: h.critical?.count ?? 0, pct: h.critical?.percent ?? 0, color: 'bg-red-500'    },
    { label: 'No Data',  count: h.no_data?.count  ?? 0, pct: 0,                         color: 'bg-gray-300'   },
  ]
})

/* ── Event handlers ─────────────────────────────────────── */
const handleFarmClick  = (farm) => { selectedFarm.value = farm }
const viewFarmDetail   = (farmId) => router.push(`/farms/${farmId}`)

/* ── Boot ───────────────────────────────────────────────── */
onMounted(async () => {
  if (farmsStore.farms.length === 0) {
    await farmsStore.fetchFarms()
  }
  alertsStore.generateAlerts(farmsStore.farms)

  // Load real analytics data in parallel
  await analyticsStore.fetchDashboardData()
  await satelliteStore.fetchCoverage()
})
</script>

<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">GeoAI Platform — Kakamega County</p>
      </div>
      <div class="flex gap-3">
        <Button label="Export Report" icon="pi pi-download" severity="secondary" outlined />
        <Button label="Add Farm"      icon="pi pi-plus"     @click="router.push('/farms/add')" />
      </div>
    </div>

    <!-- Stats Cards -->
    <StatsCards />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Map (left — 2 cols) -->
      <div class="lg:col-span-2">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-lg">Farm Locations</span>
              <Button
                  icon="pi pi-refresh"
                  text rounded
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

        <!-- Weather -->
        <WeatherWidget />

        <!-- Priority Alerts -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-lg">Priority Alerts</span>
              <Button label="View All" text size="small" @click="router.push('/alerts')" />
            </div>
          </template>
          <template #content>
            <div v-if="priorityAlerts.length === 0" class="text-center py-8 text-gray-500">
              <i class="pi pi-check-circle text-4xl text-green-500 mb-2 block"></i>
              <p>No urgent alerts</p>
            </div>
            <div v-else class="space-y-3">
              <div
                  v-for="alert in priorityAlerts"
                  :key="alert.id"
                  class="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                  :class="{
                  'bg-red-50 border-red-200':    alert.priority === 'critical',
                  'bg-orange-50 border-orange-200': alert.priority === 'high',
                  'bg-yellow-50 border-yellow-200': alert.priority === 'medium'
                }"
                  @click="viewFarmDetail(alert.farmId)"
              >
                <div class="flex items-start gap-3">
                  <i
                      class="pi pi-exclamation-triangle text-xl"
                      :class="{
                      'text-red-600':    alert.priority === 'critical',
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

        <!-- System Status — now wired to real API -->
        <Card>
          <template #title>
            <span class="text-lg">System Status</span>
          </template>
          <template #content>
            <div class="space-y-4">

              <!-- Satellite Coverage -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Satellite Coverage</span>
                <span v-if="analyticsStore.loading" class="w-20">
                  <Skeleton height="1rem" />
                </span>
                <span v-else class="text-sm font-semibold"
                      :class="coveragePercent >= 80 ? 'text-green-600' : 'text-yellow-600'"
                >
                  <i class="pi pi-satellite mr-1"></i>
                  {{ coveragePercent !== null ? `${coveragePercent}%` : '—' }}
                </span>
              </div>

              <!-- Avg Health Score -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Avg Health Score</span>
                <span v-if="analyticsStore.loading" class="w-20">
                  <Skeleton height="1rem" />
                </span>
                <span v-else class="text-sm font-semibold" :class="healthStatusLabel.cls">
                  <i class="pi pi-heart mr-1"></i>
                  {{ avgHealthScore !== null ? `${avgHealthScore}/100` : '—' }}
                  <span class="ml-1 text-xs">({{ healthStatusLabel.label }})</span>
                </span>
              </div>

              <!-- Farms Monitored -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Farms Monitored (30d)</span>
                <span v-if="analyticsStore.loading" class="w-20">
                  <Skeleton height="1rem" />
                </span>
                <span v-else class="text-sm font-semibold text-gray-900">
                  {{ analyticsStore.platformKPIs?.farms_monitored_30d ?? '—' }}
                  / {{ analyticsStore.platformKPIs?.total_farms ?? '—' }}
                </span>
              </div>

              <!-- Last Loaded -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Loaded</span>
                <span class="text-sm font-semibold text-gray-900">{{ lastUpdateLabel }}</span>
              </div>

            </div>

            <!-- Health Distribution Mini-Chart -->
            <div v-if="healthBars.length" class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-xs text-gray-500 mb-2">Farm Health Distribution</p>
              <div class="flex gap-1 h-3 rounded-full overflow-hidden">
                <div
                    v-for="bar in healthBars"
                    :key="bar.label"
                    :class="bar.color"
                    :style="{ width: `${bar.pct}%` }"
                    :title="`${bar.label}: ${bar.count} farms (${bar.pct}%)`"
                ></div>
              </div>
              <div class="flex gap-3 mt-2 flex-wrap">
                <div v-for="bar in healthBars" :key="bar.label" class="flex items-center gap-1">
                  <span class="inline-block w-2 h-2 rounded-full" :class="bar.color"></span>
                  <span class="text-xs text-gray-500">{{ bar.label }} ({{ bar.count }})</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

      </div>
    </div>

    <!-- Farms Requiring Attention Table -->
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
          <Column field="name"      header="Farm Name" />
          <Column field="crop_type" header="Crop" />
          <Column field="area_ha"   header="Area (ha)">
            <template #body="{ data }">
              {{ data.area_ha?.toFixed(1) ?? '—' }}
            </template>
          </Column>
          <Column header="Health Status">
            <template #body="{ data }">
              <Tag
                  :value="`${data.current_health?.score ?? 0}/100`"
                  :severity="
                  data.current_health?.status === 'critical' ? 'danger'  :
                  data.current_health?.status === 'watch'    ? 'warning' : 'success'
                "
              />
            </template>
          </Column>
          <Column header="Moisture">
            <template #body="{ data }">
              <Tag
                  :value="data.current_moisture?.status ?? 'N/A'"
                  :severity="
                  data.current_moisture?.status === 'dry'      ? 'danger'  :
                  data.current_moisture?.status === 'low'      ? 'warning' :
                  data.current_moisture?.status === 'adequate' ? 'success' : 'info'
                "
              />
            </template>
          </Column>
          <Column header="Action">
            <template #body="{ data }">
              <Button label="View" text size="small" @click="viewFarmDetail(data.id)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

  </div>
</template>