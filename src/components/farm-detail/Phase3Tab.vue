<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSatelliteStore } from '@/stores/satellite'

import Button   from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag      from 'primevue/tag'

const props = defineProps({
  farmId: { type: Number, required: true },
  farm:   { type: Object, default: null  },
})

const satelliteStore = useSatelliteStore()

const data    = ref(null)
const loading = ref(true)
const error   = ref(null)
const days    = ref(30)

// ── Load ──────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = null
  try {
    data.value = await satelliteStore.fetchPhase3(props.farmId, days.value)
  } catch (e) {
    error.value = e.message || 'Failed to load Phase 3 data'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Computed helpers ──────────────────────────────────────────
const health       = computed(() => data.value?.health)
const zonal        = computed(() => data.value?.zonal_stats)
const change       = computed(() => data.value?.change_detection)
const hotspots     = computed(() => data.value?.hotspots)
const recs         = computed(() => data.value?.recommendations?.recommendations ?? [])

const trendIcon = computed(() => {
  const t = change.value?.trend
  if (t === 'improving')     return { icon: 'pi-arrow-up',        cls: 'text-green-600'  }
  if (t === 'stable')        return { icon: 'pi-minus',           cls: 'text-blue-500'   }
  if (t === 'declining')     return { icon: 'pi-arrow-down',      cls: 'text-amber-500'  }
  if (t === 'rapid_decline') return { icon: 'pi-arrow-down',      cls: 'text-red-600'    }
  return                            { icon: 'pi-question-circle', cls: 'text-gray-400'   }
})

const alertSeverity = computed(() => {
  const a = change.value?.alert
  if (a === 'critical') return 'danger'
  if (a === 'watch')    return 'warn'
  return 'success'
})

const prioritySeverity = (p) => ({
  critical: 'danger', high: 'danger', medium: 'warn', low: 'success'
}[p] ?? 'secondary')

const priorityIcon = (p) => ({
  critical: 'pi-exclamation-triangle',
  high:     'pi-exclamation-circle',
  medium:   'pi-info-circle',
  low:      'pi-check-circle',
}[p] ?? 'pi-circle')

const severityColor = (s) => ({
  healthy:  'bg-green-500',
  moderate: 'bg-amber-400',
  stressed: 'bg-orange-500',
  critical: 'bg-red-600',
  unknown:  'bg-gray-300',
}[s] ?? 'bg-gray-300')

// Grid rendering helpers
const gridSize   = computed(() => hotspots.value?.hotspots?.length
    ? Math.round(Math.sqrt(hotspots.value.hotspots.length)) : 3)

const gridCells  = computed(() => {
  const cells = hotspots.value?.hotspots ?? []
  // Sort by row then col so CSS grid renders correctly
  return [...cells].sort((a, b) => a.row - b.row || a.col - b.col)
})
</script>

<template>
  <div class="space-y-6">

    <!-- Header row -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h3 class="text-base font-bold text-gray-800">Phase 3 — Satellite Intelligence</h3>
        <p class="text-xs text-gray-400 mt-0.5">
          Real Sentinel-2 zonal analysis · Change detection · Stress mapping
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
            v-model="days"
            class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
            @change="load"
        >
          <option :value="15">Last 15 days</option>
          <option :value="30">Last 30 days</option>
          <option :value="60">Last 60 days</option>
          <option :value="90">Last 90 days</option>
        </select>
        <Button icon="pi pi-refresh" size="small" outlined :loading="loading" @click="load" />
      </div>
    </div>

    <!-- Error -->
    <div v-if="error && !loading" class="rounded-xl border border-red-200 bg-red-50 p-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-circle text-red-500"></i>
        <p class="text-sm text-red-700 font-medium">{{ error }}</p>
      </div>
      <Button label="Retry" icon="pi pi-refresh" text size="small" class="mt-2" @click="load" />
    </div>

    <!-- Loading skeletons -->
    <div v-else-if="loading" class="space-y-4">
      <Skeleton height="80px"  border-radius="12px" />
      <div class="grid grid-cols-2 gap-4">
        <Skeleton height="140px" border-radius="12px" />
        <Skeleton height="140px" border-radius="12px" />
      </div>
      <Skeleton height="180px" border-radius="12px" />
      <Skeleton height="200px" border-radius="12px" />
    </div>

    <template v-else-if="data">

      <!-- ── 1. Automated Health Score ───────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white p-5">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Automated Health Score
        </p>
        <div class="flex items-center gap-6 flex-wrap">
          <!-- Score gauge -->
          <div class="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" class="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke="#f3f4f6" stroke-width="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                      :stroke="health?.score >= 70 ? '#22c55e'
                               : health?.score >= 50 ? '#f59e0b' : '#ef4444'"
                      stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="`${(health?.score ?? 0)} 100`" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-xl font-extrabold text-gray-900">
                {{ health?.score ?? '—' }}
              </span>
              <span class="text-xs text-gray-400">/100</span>
            </div>
          </div>

          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2">
              <Tag
                  :value="(health?.status?.status ?? 'unknown').toUpperCase()"
                  :severity="health?.score >= 70 ? 'success' : health?.score >= 50 ? 'warn' : 'danger'"
              />
              <span class="text-sm text-gray-500 capitalize">
                {{ health?.status?.label ?? '' }}
              </span>
            </div>
            <!-- Component breakdown -->
            <div class="grid grid-cols-3 gap-2 mt-2">
              <div class="text-center bg-gray-50 rounded-lg p-2">
                <p class="text-xs text-gray-400">NDVI Base</p>
                <p class="text-sm font-bold text-gray-700">
                  {{ health?.components?.ndvi_base_score ?? '—' }}
                </p>
              </div>
              <div class="text-center bg-red-50 rounded-lg p-2">
                <p class="text-xs text-gray-400">Water Penalty</p>
                <p class="text-sm font-bold text-red-600">
                  -{{ health?.components?.water_penalty ?? 0 }}
                </p>
              </div>
              <div class="text-center bg-green-50 rounded-lg p-2">
                <p class="text-xs text-gray-400">LAI Bonus</p>
                <p class="text-sm font-bold text-green-600">
                  +{{ health?.components?.lai_bonus ?? 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 2. Zonal Stats + Change Detection (side by side) ── -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- Zonal Stats -->
        <div class="rounded-xl border border-gray-100 bg-white p-5">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Zonal Statistics
            <span class="ml-1 text-gray-300 font-normal normal-case">
              ({{ zonal?.n_images ?? 0 }} images, {{ days }}d)
            </span>
          </p>
          <div class="space-y-3">
            <div v-for="(key, label) in { ndvi: 'NDVI', savi: 'SAVI', ndwi: 'NDWI', lai: 'LAI' }"
                 :key="key">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-semibold text-gray-600">{{ label }}</span>
                <span class="text-gray-400">
                  {{ zonal?.stats?.[key]?.min?.toFixed(3) ?? '—' }}
                  &rarr;
                  {{ zonal?.stats?.[key]?.max?.toFixed(3) ?? '—' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                      class="h-full bg-green-500 rounded-full"
                      :style="{
                      width: key === 'lai'
                        ? `${Math.min(100, ((zonal?.stats?.[key]?.mean ?? 0) / 8) * 100)}%`
                        : `${Math.min(100, Math.max(0, ((zonal?.stats?.[key]?.mean ?? 0) + 1) / 2 * 100))}%`
                    }"
                  />
                </div>
                <span class="text-xs font-bold text-gray-700 w-12 text-right">
                  {{ zonal?.stats?.[key]?.mean?.toFixed(3) ?? '—' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Change Detection -->
        <div class="rounded-xl border border-gray-100 bg-white p-5">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            NDVI Change Detection
          </p>

          <!-- Trend badge -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              <i :class="`pi ${trendIcon.icon} text-lg ${trendIcon.cls}`"></i>
            </div>
            <div>
              <p class="font-bold text-gray-800 capitalize">
                {{ change?.trend?.replace('_', ' ') ?? 'Unknown' }}
              </p>
              <Tag
                  :value="(change?.alert ?? 'none').toUpperCase()"
                  :severity="alertSeverity"
                  class="text-xs"
              />
            </div>
            <div class="ml-auto text-right">
              <p class="text-xs text-gray-400">Δ NDVI</p>
              <p class="text-lg font-extrabold"
                 :class="(change?.delta ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ change?.delta !== null && change?.delta !== undefined
                  ? (change.delta >= 0 ? '+' : '') + change.delta.toFixed(3)
                  : '—' }}
              </p>
            </div>
          </div>

          <!-- Period comparison -->
          <div class="grid grid-cols-2 gap-2 text-center mb-3">
            <div class="bg-gray-50 rounded-lg p-2">
              <p class="text-xs text-gray-400">Previous</p>
              <p class="text-base font-bold text-gray-600">
                {{ change?.previous_mean?.toFixed(3) ?? '—' }}
              </p>
            </div>
            <div class="bg-blue-50 rounded-lg p-2">
              <p class="text-xs text-blue-400">Current</p>
              <p class="text-base font-bold text-blue-700">
                {{ change?.current_mean?.toFixed(3) ?? '—' }}
              </p>
            </div>
          </div>

          <!-- Monthly sparkline -->
          <div v-if="change?.monthly_series?.length" class="mt-3">
            <p class="text-xs text-gray-400 mb-1">6-Month Trend</p>
            <div class="flex items-end gap-1 h-12">
              <div
                  v-for="(pt, i) in change.monthly_series"
                  :key="i"
                  class="flex-1 rounded-t transition-all"
                  :class="pt.ndvi !== null ? 'bg-green-400' : 'bg-gray-100'"
                  :style="{ height: pt.ndvi !== null ? `${Math.max(8, pt.ndvi * 100)}%` : '8%' }"
                  :title="`${pt.month}: ${pt.ndvi ?? 'No data'}`"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-300 mt-1">
              <span>{{ change.monthly_series[0]?.month }}</span>
              <span>{{ change.monthly_series[change.monthly_series.length - 1]?.month }}</span>
            </div>
          </div>

          <p v-if="change?.alert_message" class="text-xs text-gray-500 mt-3 leading-relaxed">
            {{ change.alert_message }}
          </p>
        </div>
      </div>

      <!-- ── 3. Stress Hotspot Grid ───────────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Crop Stress Hotspots
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ hotspots?.grid_size }} grid
              · {{ hotspots?.stressed_cells ?? 0 }}/{{ hotspots?.total_cells ?? 0 }} cells stressed
              · {{ hotspots?.stress_pct ?? 0 }}% area affected
              <span v-if="hotspots?.is_buffered_point" class="text-amber-500">
                · 500m buffer (no boundary uploaded)
              </span>
            </p>
          </div>
          <Tag
              :value="(hotspots?.overall_stress ?? 'unknown').toUpperCase()"
              :severity="hotspots?.overall_stress === 'none' ? 'success'
                      : hotspots?.overall_stress === 'low'  ? 'info'
                      : hotspots?.overall_stress === 'moderate' ? 'warn' : 'danger'"
          />
        </div>

        <!-- Grid visualization -->
        <div
            class="grid gap-1 mx-auto"
            :style="`
            grid-template-columns: repeat(${gridSize}, 1fr);
            max-width: ${gridSize * 64}px;
          `"
        >
          <div
              v-for="cell in gridCells"
              :key="cell.cell_id"
              class="aspect-square rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold relative group cursor-default"
              :class="severityColor(cell.severity)"
          >
            <span class="text-xs font-extrabold drop-shadow">
              {{ cell.ndvi?.toFixed(2) ?? '?' }}
            </span>
            <!-- Tooltip -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block
                        bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
              Row {{ cell.row + 1 }}, Col {{ cell.col + 1 }}<br>
              NDVI: {{ cell.ndvi?.toFixed(4) ?? 'N/A' }}<br>
              {{ cell.severity }}
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 justify-center flex-wrap">
          <div v-for="(cls, label) in {
            'Healthy (≥0.5)':  'bg-green-500',
            'Moderate (0.3–0.5)': 'bg-amber-400',
            'Stressed (0.1–0.3)': 'bg-orange-500',
            'Critical (<0.1)':    'bg-red-600',
          }" :key="label" class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-3 h-3 rounded flex-shrink-0" :class="cls"></span>
            {{ label }}
          </div>
        </div>
      </div>

      <!-- ── 4. Spatial Recommendations ──────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white p-5">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
          AI Spatial Recommendations
          <span class="ml-1 font-normal normal-case text-gray-300">
            ({{ recs.length }} action{{ recs.length !== 1 ? 's' : '' }})
          </span>
        </p>

        <div class="space-y-3">
          <div
              v-for="rec in recs"
              :key="rec.title"
              class="flex items-start gap-3 p-3 rounded-xl border"
              :class="{
              'border-red-200 bg-red-50':    rec.priority === 'critical' || rec.priority === 'high',
              'border-amber-200 bg-amber-50': rec.priority === 'medium',
              'border-green-200 bg-green-50': rec.priority === 'low',
            }"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 :class="{
                   'bg-red-100':    rec.priority === 'critical' || rec.priority === 'high',
                   'bg-amber-100':  rec.priority === 'medium',
                   'bg-green-100':  rec.priority === 'low',
                 }">
              <i :class="`pi ${priorityIcon(rec.priority)} text-sm`"
                 :style="rec.priority === 'critical' || rec.priority === 'high' ? 'color:#dc2626'
                        : rec.priority === 'medium' ? 'color:#d97706' : 'color:#16a34a'"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-800">{{ rec.title }}</p>
                <Tag
                    :value="rec.priority.toUpperCase()"
                    :severity="prioritySeverity(rec.priority)"
                    class="text-xs"
                />
                <span class="text-xs text-gray-400 capitalize">{{ rec.category }}</span>
              </div>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed">{{ rec.detail }}</p>
              <p v-if="rec.metric" class="text-xs font-mono text-gray-400 mt-1">
                {{ rec.metric }}
              </p>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>