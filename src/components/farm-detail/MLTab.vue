<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMLStore } from '@/stores/ml'

import Card    from 'primevue/card'
import Button  from 'primevue/button'
import Tag     from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const props = defineProps({
  farmId: { type: Number, required: true },
  farm:   { type: Object, default: null },
})

const mlStore = useMLStore()
const data    = ref(null)

const loading = computed(() => mlStore.loading)
const error   = computed(() => mlStore.error)

// ── Risk severity helpers ─────────────────────────────────────
function riskSeverity(level) {
  return { low: 'success', medium: 'warn', high: 'danger', critical: 'danger' }[level] ?? 'secondary'
}

function trendIcon(trend) {
  if (trend === 'Improving') return 'pi pi-arrow-up text-green-500'
  if (trend === 'Declining') return 'pi pi-arrow-down text-red-500'
  return 'pi pi-minus text-gray-400'
}

function trendColor(delta) {
  if (delta >  3) return 'text-green-600'
  if (delta < -3) return 'text-red-600'
  return 'text-gray-500'
}

function performanceColor(pct) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-400'
  return 'bg-red-500'
}

function ratingColor(rating) {
  return {
    Excellent: 'text-green-600 bg-green-50 border-green-200',
    Good:      'text-blue-600 bg-blue-50 border-blue-200',
    Fair:      'text-amber-600 bg-amber-50 border-amber-200',
    Poor:      'text-red-600 bg-red-50 border-red-200',
  }[rating] ?? 'text-gray-600 bg-gray-50 border-gray-200'
}

async function load() {
  const result = await mlStore.fetchFarmPredictions(props.farmId)
  data.value = result
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 pt-2">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <Skeleton v-for="i in 3" :key="i" height="140px" border-radius="12px" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-gray-400">
      <i class="pi pi-exclamation-circle text-4xl block mb-3 text-red-400"></i>
      <p class="font-medium text-gray-600">Failed to load ML predictions</p>
      <p class="text-sm mt-1">{{ error }}</p>
      <Button label="Retry" icon="pi pi-refresh" text size="small" class="mt-3" @click="load" />
    </div>

    <template v-else-if="data">

      <!-- ── 1. Yield Prediction ─────────────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <i class="pi pi-chart-bar text-sm"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm">Yield Prediction</p>
            <p class="text-xs text-gray-400">RandomForest — based on NDVI, health, soil & irrigation</p>
          </div>
          <span
              class="ml-auto text-xs font-semibold px-3 py-1 rounded-full border"
              :class="ratingColor(data.yield?.rating)"
          >
            {{ data.yield?.rating ?? '—' }}
          </span>
        </div>

        <div class="p-5">
          <div class="grid grid-cols-3 gap-4 mb-5">
            <div class="text-center">
              <p class="text-2xl font-extrabold text-gray-900">
                {{ data.yield?.predicted_yield_tons_ha ?? '—' }}
              </p>
              <p class="text-xs text-gray-400 mt-1">t / ha predicted</p>
            </div>
            <div class="text-center border-x border-gray-100">
              <p class="text-2xl font-extrabold text-green-600">
                {{ data.yield?.total_yield_tons ?? '—' }}
              </p>
              <p class="text-xs text-gray-400 mt-1">total tons ({{ farm?.area_ha?.toFixed(1) }} ha)</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-extrabold text-blue-600">
                {{ data.yield?.performance_pct ?? '—' }}%
              </p>
              <p class="text-xs text-gray-400 mt-1">of benchmark max</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mb-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>Performance vs. benchmark ({{ data.yield?.benchmark_min }}–{{ data.yield?.benchmark_max }} t/ha)</span>
              <span>{{ data.yield?.performance_pct }}%</span>
            </div>
            <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="performanceColor(data.yield?.performance_pct)"
                  :style="{ width: `${data.yield?.performance_pct ?? 0}%` }"
              />
            </div>
          </div>

          <p class="text-xs text-gray-400">Model MAE: ±{{ data.yield?.model_mae }} t/ha</p>
        </div>
      </div>

      <!-- ── 2. Pest & Disease Risk ──────────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <i class="pi pi-shield text-sm"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm">Pest & Disease Risk</p>
            <p class="text-xs text-gray-400">RandomForest — moisture, humidity, temperature & trend</p>
          </div>
          <Tag
              :value="(data.pest_risk?.risk_level ?? '—').toUpperCase()"
              :severity="riskSeverity(data.pest_risk?.risk_level)"
              class="ml-auto"
          />
        </div>

        <div class="p-5">
          <!-- Risk probability bars -->
          <div class="grid grid-cols-4 gap-3 mb-5">
            <div
                v-for="(pct, level) in data.pest_risk?.probabilities"
                :key="level"
                class="text-center"
            >
              <div class="h-16 bg-gray-100 rounded-lg flex items-end overflow-hidden">
                <div
                    class="w-full rounded-lg transition-all duration-700"
                    :class="{
                    'bg-green-400':  level === 'low',
                    'bg-amber-400':  level === 'medium',
                    'bg-orange-500': level === 'high',
                    'bg-red-600':    level === 'critical',
                  }"
                    :style="{ height: `${pct}%` }"
                />
              </div>
              <p class="text-xs text-gray-500 mt-1 capitalize">{{ level }}</p>
              <p class="text-xs font-bold text-gray-700">{{ pct }}%</p>
            </div>
          </div>

          <!-- Contributing factors -->
          <div class="space-y-2 mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Contributing Factors
            </p>
            <div
                v-for="(factor, i) in data.pest_risk?.contributing_factors"
                :key="i"
                class="flex items-start gap-2 text-sm"
            >
              <i class="pi pi-info-circle text-amber-500 mt-0.5 flex-shrink-0"></i>
              <span class="text-gray-700">{{ factor }}</span>
            </div>
          </div>

          <!-- Recommendation -->
          <div class="rounded-lg p-3 bg-blue-50 border border-blue-100">
            <p class="text-xs font-semibold text-blue-700 mb-1">Recommended Action</p>
            <p class="text-sm text-blue-800">{{ data.pest_risk?.recommendation }}</p>
          </div>

          <p class="text-xs text-gray-400 mt-3">
            Confidence: {{ data.pest_risk?.confidence_pct }}% — Model accuracy: {{ (data.pest_risk?.model_accuracy * 100).toFixed(1) }}%
          </p>
        </div>
      </div>

      <!-- ── 3. Health Forecast ──────────────────────────────── -->
      <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <i class="pi pi-calendar text-sm"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm">14-Day Health Forecast</p>
            <p class="text-xs text-gray-400">GradientBoosting — current health, NDVI trend & weather</p>
          </div>
          <span class="ml-auto text-xs text-gray-400">{{ data.health_forecast?.confidence_note }}</span>
        </div>

        <div class="p-5">
          <div class="flex items-center justify-between mb-6">

            <!-- Current -->
            <div class="text-center">
              <p class="text-xs text-gray-400 mb-1">Current Score</p>
              <p class="text-4xl font-extrabold text-gray-700">
                {{ data.health_forecast?.current_score ?? '—' }}
              </p>
            </div>

            <!-- Arrow + trend -->
            <div class="flex flex-col items-center gap-1">
              <i
                  class="text-2xl"
                  :class="trendIcon(data.health_forecast?.trend)"
              ></i>
              <span
                  class="text-sm font-semibold"
                  :class="trendColor(data.health_forecast?.delta)"
              >
                {{ data.health_forecast?.delta > 0 ? '+' : '' }}{{ data.health_forecast?.delta }}
              </span>
              <span class="text-xs text-gray-400">14 days</span>
            </div>

            <!-- Forecast -->
            <div class="text-center">
              <p class="text-xs text-gray-400 mb-1">Forecast Score</p>
              <p
                  class="text-4xl font-extrabold"
                  :class="trendColor(data.health_forecast?.delta)"
              >
                {{ data.health_forecast?.forecast_score_14d ?? '—' }}
              </p>
            </div>
          </div>

          <!-- Trend badge -->
          <div class="flex items-center justify-between">
            <span
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border"
                :class="{
                'bg-green-50 text-green-700 border-green-200': data.health_forecast?.trend === 'Improving',
                'bg-red-50 text-red-700 border-red-200':       data.health_forecast?.trend === 'Declining',
                'bg-gray-50 text-gray-600 border-gray-200':    data.health_forecast?.trend === 'Stable',
              }"
            >
              <i :class="trendIcon(data.health_forecast?.trend)"></i>
              {{ data.health_forecast?.trend }} — {{ data.health_forecast?.forecast_status }}
            </span>
            <span class="text-xs text-gray-400">
              Model MAE: ±{{ data.health_forecast?.model_mae }} pts
            </span>
          </div>
        </div>
      </div>

      <!-- Retrain note -->
      <div class="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>Predictions based on latest NDVI, moisture and weather readings</span>
        <Button
            label="Refresh Predictions"
            icon="pi pi-refresh"
            text size="small"
            @click="load"
            :loading="loading"
        />
      </div>

    </template>

    <!-- Empty -->
    <div v-else class="text-center py-12 text-gray-400">
      <i class="pi pi-chart-line text-4xl block mb-3"></i>
      <p class="font-medium">No ML predictions available</p>
      <Button label="Load Predictions" icon="pi pi-play" text size="small" class="mt-3" @click="load" />
    </div>

  </div>
</template>