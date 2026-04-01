<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }          from 'vue-router'
import { useFarmsStore }      from '@/stores/farms'
import { useAlertsStore }     from '@/stores/alerts'
import { useAnalyticsStore }  from '@/stores/analytics'
import { useSatelliteStore }  from '@/stores/satellite'
import { useLayersStore }     from '@/stores/layers'

import Card     from 'primevue/card'
import Button   from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag      from 'primevue/tag'

import StatsCards    from '@/components/StatsCards.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'

const router         = useRouter()
const farmsStore     = useFarmsStore()
const alertsStore    = useAlertsStore()
const analyticsStore = useAnalyticsStore()
const satelliteStore = useSatelliteStore()
const layersStore    = useLayersStore()

const priorityAlerts = computed(() => [
  ...alertsStore.criticalAlerts.slice(0, 2),
  ...alertsStore.highAlerts.slice(0, 3),
].slice(0, 5))

const coveragePercent = computed(() =>
    analyticsStore.platformKPIs?.monitoring_rate_pct ?? null
)

const avgHealthScore = computed(() =>
    analyticsStore.platformKPIs?.avg_health_score ?? null
)

const lastUpdateLabel = computed(() => {
  if (!analyticsStore.platformKPIs) return '—'
  return new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
})

const healthStatusLabel = computed(() => {
  const score = avgHealthScore.value
  if (score === null)  return { label: '—',               cls: 'text-gray-400' }
  if (score >= 70)     return { label: 'Good',            cls: 'text-green-600' }
  if (score >= 40)     return { label: 'Fair',            cls: 'text-yellow-600' }
  return                      { label: 'Needs Attention', cls: 'text-red-600' }
})

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

const totalParcels = computed(() =>
    layersStore.layers.reduce((s, l) => s + l.farm_count, 0)
)

const viewFarmDetail = (farmId) => router.push(`/farms/${farmId}`)

onMounted(async () => {
  await farmsStore.fetchFarms()
  alertsStore.generateAlerts(farmsStore.farms)
  await Promise.all([
    analyticsStore.fetchDashboardData(),
    satelliteStore.fetchCoverage(),
    layersStore.fetchLayers(),
  ])
})
</script>

<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">GeoAI Platform — Kakamega County</p>
      </div>
      <div class="flex gap-2">
        <Button label="Export Report" icon="pi pi-download" severity="secondary" outlined size="small" />
        <Button label="Open Map"      icon="pi pi-map"      size="small"
                @click="router.push('/farms')" />
      </div>
    </div>

    <!-- KPI Cards -->
    <StatsCards />

    <!-- Layer Summary + Satellite Coverage row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Parcels</p>
              <p class="text-3xl font-extrabold text-gray-900 mt-1">
                {{ analyticsStore.loading ? '—' : totalParcels }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                across {{ layersStore.layers.length }}
                layer{{ layersStore.layers.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <i class="pi pi-map text-xl text-blue-500"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Satellite Coverage</p>
              <p class="text-3xl font-extrabold mt-1"
                 :class="(coveragePercent ?? 0) >= 80 ? 'text-green-600' : 'text-yellow-600'">
                <Skeleton v-if="analyticsStore.loading" height="2rem" width="6rem" />
                <span v-else>{{ coveragePercent !== null ? `${coveragePercent}%` : '—' }}</span>
              </p>
              <p class="text-xs text-gray-400 mt-1">farms monitored (30d)</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <i class="pi pi-satellite text-xl text-green-500"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Average Health Score</p>
              <p class="text-3xl font-extrabold mt-1" :class="healthStatusLabel.cls">
                <Skeleton v-if="analyticsStore.loading" height="2rem" width="6rem" />
                <span v-else>{{ avgHealthScore !== null ? `${avgHealthScore}/100` : '—' }}</span>
              </p>
              <p class="text-xs mt-1" :class="healthStatusLabel.cls">
                {{ healthStatusLabel.label }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <i class="pi pi-heart text-xl text-indigo-500"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main content row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left: Health distribution + Layers summary -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Health Distribution -->
        <Card>
          <template #title>
                        <span class="text-base font-semibold text-gray-800">
                            Farm Health Distribution
                        </span>
          </template>
          <template #content>
            <div v-if="analyticsStore.loading" class="space-y-4">
              <Skeleton v-for="i in 4" :key="i" height="40px" border-radius="8px" />
            </div>
            <div v-else-if="healthBars.length" class="space-y-3">
              <div v-for="bar in healthBars" :key="bar.label" class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-gray-700">{{ bar.label }}</span>
                  <span class="text-gray-500">{{ bar.count }} farms</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                      class="h-full rounded-full transition-all duration-700"
                      :class="bar.color"
                      :style="{ width: `${bar.pct}%` }"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-400">
              <i class="pi pi-chart-bar text-3xl block mb-2"></i>
              <p class="text-sm">No health data available yet</p>
            </div>
          </template>
        </Card>

        <!-- Layers Summary -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-base font-semibold text-gray-800">Map Layers</span>
              <Button
                  label="Manage Layers"
                  icon="pi pi-map"
                  text size="small"
                  @click="router.push('/farms')"
              />
            </div>
          </template>
          <template #content>
            <div v-if="!layersStore.layers.length" class="text-center py-8 text-gray-400">
              <i class="pi pi-layers text-3xl block mb-2"></i>
              <p class="text-sm">No layers uploaded yet</p>
              <Button
                  label="Upload Boundaries"
                  icon="pi pi-upload"
                  text size="small"
                  class="mt-2"
                  @click="router.push('/farms')"
              />
            </div>
            <div v-else class="space-y-3">
              <div
                  v-for="layer in layersStore.layers"
                  :key="layer.id"
                  class="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                                       hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="router.push('/farms')"
              >
                <div
                    class="w-4 h-4 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: layer.color }"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">
                    {{ layer.name }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ layer.farm_count }} parcel{{ layer.farm_count !== 1 ? 's' : '' }}
                  </p>
                </div>
                <Tag
                    :value="layer.visible ? 'Visible' : 'Hidden'"
                    :severity="layer.visible ? 'success' : 'secondary'"
                    size="small"
                />
              </div>
            </div>
          </template>
        </Card>

      </div>

      <!-- Right: Weather + Alerts + System Status -->
      <div class="space-y-6">

        <WeatherWidget />

        <!-- Priority Alerts -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-base font-semibold text-gray-800">Priority Alerts</span>
              <Button label="View All" text size="small" @click="router.push('/alerts')" />
            </div>
          </template>
          <template #content>
            <div v-if="!priorityAlerts.length" class="text-center py-6 text-gray-400">
              <i class="pi pi-check-circle text-3xl text-green-500 block mb-2"></i>
              <p class="text-sm">No urgent alerts</p>
            </div>
            <div v-else class="space-y-3">
              <div
                  v-for="alert in priorityAlerts"
                  :key="alert.id"
                  class="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                  :class="{
                                    'bg-red-50 border-red-200':    alert.priority === 'critical',
                                    'bg-orange-50 border-orange-200': alert.priority === 'high',
                                    'bg-yellow-50 border-yellow-200': alert.priority === 'medium',
                                }"
                  @click="viewFarmDetail(alert.farmId)"
              >
                <div class="flex items-start gap-2">
                  <i
                      class="pi pi-exclamation-triangle mt-0.5"
                      :class="{
                                            'text-red-600':    alert.priority === 'critical',
                                            'text-orange-600': alert.priority === 'high',
                                            'text-yellow-600': alert.priority === 'medium',
                                        }"
                  ></i>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ alert.farmName }}</p>
                    <p class="text-xs text-gray-600 mt-0.5">{{ alert.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- System Status -->
        <Card>
          <template #title>
            <span class="text-base font-semibold text-gray-800">System Status</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Satellite Coverage</span>
                <span
                    class="font-semibold"
                    :class="(coveragePercent ?? 0) >= 80 ? 'text-green-600' : 'text-yellow-600'"
                >
                                    {{ coveragePercent !== null ? `${coveragePercent}%` : '—' }}
                                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Avg Health Score</span>
                <span class="font-semibold" :class="healthStatusLabel.cls">
                                    {{ avgHealthScore !== null ? `${avgHealthScore}/100` : '—' }}
                                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Farms Monitored (30d)</span>
                <span class="font-semibold text-gray-900">
                                    {{ analyticsStore.platformKPIs?.farms_monitored_30d ?? '—' }}
                                    / {{ analyticsStore.platformKPIs?.total_farms ?? '—' }}
                                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Last Loaded</span>
                <span class="font-semibold text-gray-900">{{ lastUpdateLabel }}</span>
              </div>
            </div>
          </template>
        </Card>

      </div>
    </div>
  </div>
</template>