<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSatelliteStore } from '@/stores/satellite'

import Button        from 'primevue/button'
import Skeleton      from 'primevue/skeleton'
import ProgressBar   from 'primevue/progressbar'
import Tag           from 'primevue/tag'
import Message       from 'primevue/message'

const props = defineProps({
  farmId: { type: Number, required: true },
  farm:   { type: Object, default: null  },
})

const satelliteStore = useSatelliteStore()
const indices        = ref(null)
const ndviSeries     = ref([])
const loading        = ref(false)
const refreshing     = ref(false)
const error          = ref(null)

// ── Index definitions ────────────────────────────────────────
const INDEX_META = {
  ndvi: { label: 'NDVI', icon: '🌿', min: -1, max: 1,  goodMin: 0.4, goodMax: 0.9 },
  savi: { label: 'SAVI', icon: '🌱', min: -1, max: 1,  goodMin: 0.3, goodMax: 0.7 },
  ndwi: { label: 'NDWI', icon: '💧', min: -1, max: 1,  goodMin: 0.1, goodMax: 0.5 },
  lai:  { label: 'LAI',  icon: '🍃', min:  0, max: 8,  goodMin: 2.0, goodMax: 6.0 },
}

// ── Severity mapping for PrimeVue Tag ────────────────────────
const severityMap = {
  excellent: 'success', good: 'success', high: 'success', adequate: 'success', dense: 'success',
  moderate:  'warning', medium: 'warning', low: 'warning', sparse: 'warning',
  stressed:  'danger',  bare: 'danger',   dry: 'danger',   poor: 'danger',
  unknown:   'secondary',
}

const getSeverity = (status) => severityMap[status] || 'secondary'

// ── Progress bar value (0-100) from raw index value ──────────
function toPercent(key, value) {
  if (value === null || value === undefined) return 0
  const { min, max } = INDEX_META[key]
  return Math.round(((value - min) / (max - min)) * 100)
}

// ── Good range marker position (%) ───────────────────────────
function goodRangeStyle(key) {
  const { min, max, goodMin, goodMax } = INDEX_META[key]
  const left  = ((goodMin - min) / (max - min)) * 100
  const width = ((goodMax - goodMin) / (max - min)) * 100
  return { left: `${left}%`, width: `${width}%` }
}

// ── Computed index list ───────────────────────────────────────
const indexList = computed(() => {
  if (!indices.value) return []
  return Object.entries(INDEX_META).map(([key, meta]) => {
    const idx = indices.value[key]
    return {
      key,
      ...meta,
      value:          idx?.value ?? null,
      interpretation: idx?.interpretation ?? {},
      use:            idx?.use ?? '',
      unit:           idx?.unit ?? '',
      goodRange:      idx?.good_range ?? '',
      percent:        toPercent(key, idx?.value),
    }
  })
})

const assessment = computed(() => indices.value?.overall_assessment ?? null)

// ── Sparkline chart data (NDVI history) ──────────────────────
const sparkPoints = computed(() => {
  if (!ndviSeries.value.length) return ''
  const vals = ndviSeries.value.map(d => d.ndvi).filter(v => v !== null)
  if (!vals.length) return ''
  const W = 200, H = 50
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 0.1
  return vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 6) - 3
    return `${x},${y}`
  }).join(' ')
})

// ── Load data ─────────────────────────────────────────────────
async function loadIndices() {
  loading.value = true
  error.value   = null
  try {
    const res = await satelliteStore.fetchIndices(props.farmId)
    indices.value = res.indices
    // Also load NDVI history for sparkline
    const hist = await satelliteStore.fetchHistory(props.farmId, 60)
    ndviSeries.value = hist.ndvi_series || []
  } catch (e) {
    error.value = e.message || 'Failed to load satellite indices'
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  refreshing.value = true
  error.value      = null
  try {
    await satelliteStore.refreshFarmData(props.farmId)
    await loadIndices()
  } catch (e) {
    error.value = e.message || 'Refresh failed'
  } finally {
    refreshing.value = false
  }
}

onMounted(loadIndices)
watch(() => props.farmId, loadIndices)
</script>

<template>
  <div class="space-y-6 py-2">

    <!-- Header row -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">
          Sentinel-2 via Google Earth Engine
          <span v-if="indices" class="ml-2 text-xs text-gray-400">· {{ indices?.date ?? 'today' }}</span>
        </p>
      </div>
      <Button
          label="Refresh from GEE"
          icon="pi pi-refresh"
          size="small"
          outlined
          :loading="refreshing"
          @click="handleRefresh"
      />
    </div>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Loading skeletons -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Skeleton v-for="i in 4" :key="i" height="140px" border-radius="12px" />
    </div>

    <!-- Index Cards -->
    <div v-else-if="indexList.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
          v-for="idx in indexList"
          :key="idx.key"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Card header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ idx.icon }}</span>
            <div>
              <p class="font-bold text-gray-900 text-sm">{{ idx.label }}</p>
              <p class="text-xs text-gray-400">{{ idx.unit }}</p>
            </div>
          </div>
          <Tag
              :value="idx.interpretation.status ?? 'N/A'"
              :severity="getSeverity(idx.interpretation.status)"
              class="capitalize text-xs"
          />
        </div>

        <!-- Big value -->
        <div class="text-3xl font-black mb-1"
             :style="{ color: idx.interpretation.color ?? '#555' }"
        >
          {{ idx.value !== null ? idx.value.toFixed(3) : '—' }}
        </div>

        <!-- Progress bar with good-range overlay -->
        <div class="relative h-3 rounded-full bg-gray-100 overflow-visible mb-2 mt-3">
          <!-- Good range band -->
          <div
              class="absolute top-0 h-full rounded-full bg-green-100 opacity-60"
              :style="goodRangeStyle(idx.key)"
          ></div>
          <!-- Filled bar -->
          <div
              class="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
              :style="{ width: `${idx.percent}%`, backgroundColor: idx.interpretation.color ?? '#9E9E9E' }"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mb-2">
          <span>{{ INDEX_META[idx.key].min }}</span>
          <span class="text-green-600 text-xs">good: {{ idx.goodRange }}</span>
          <span>{{ INDEX_META[idx.key].max }}</span>
        </div>

        <!-- Description -->
        <p class="text-xs text-gray-600 mt-1">{{ idx.interpretation.description }}</p>
        <p class="text-xs text-gray-400 mt-1 italic">{{ idx.use }}</p>
      </div>
    </div>

    <!-- Overall Assessment -->
    <div
        v-if="assessment && !loading"
        class="rounded-xl p-4 border"
        :class="assessment.status === 'good'
        ? 'bg-green-50 border-green-200'
        : 'bg-amber-50 border-amber-200'"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">{{ assessment.status === 'good' ? '✅' : '⚠️' }}</span>
        <p class="font-semibold text-gray-900">Overall Assessment</p>
      </div>
      <p class="text-sm text-gray-700 mb-3">{{ assessment.summary }}</p>
      <ul class="space-y-1">
        <li
            v-for="(rec, i) in assessment.recommendations"
            :key="i"
            class="text-sm text-gray-700 flex items-start gap-2"
        >
          <span class="text-green-600 mt-0.5">→</span>
          {{ rec }}
        </li>
      </ul>
    </div>

    <!-- NDVI Sparkline -->
    <div v-if="sparkPoints && !loading" class="rounded-xl border border-gray-200 bg-white p-4">
      <p class="text-sm font-semibold text-gray-700 mb-3">NDVI Trend (last 60 days)</p>
      <svg viewBox="0 0 200 56" class="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ndvi-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#4CAF50" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#4CAF50" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polyline
            :points="sparkPoints"
            fill="none"
            stroke="#4CAF50"
            stroke-width="1.5"
            stroke-linejoin="round"
        />
      </svg>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>{{ ndviSeries[0]?.date ?? '' }}</span>
        <span>{{ ndviSeries[ndviSeries.length - 1]?.date ?? '' }}</span>
      </div>
    </div>

  </div>
</template>