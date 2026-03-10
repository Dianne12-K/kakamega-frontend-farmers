<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms.js'
import { useMapStyles }  from '@/composables/useMapStyles.js'

import DataTable  from 'primevue/datatable'
import Column     from 'primevue/column'
import Button     from 'primevue/button'
import InputText  from 'primevue/inputtext'
import Select     from 'primevue/select'
import Tag        from 'primevue/tag'
import IconField  from 'primevue/iconfield'
import InputIcon  from 'primevue/inputicon'

const router     = useRouter()
const farmsStore = useFarmsStore()
const { getHealthSeverity } = useMapStyles()

// ── Filters ───────────────────────────────────────────────────
const globalFilter   = ref('')
const selectedCrop   = ref(null)
const selectedStatus = ref(null)
const selectedHealth = ref(null)

const cropOptions = [
  { label: 'All Crops',  value: null },
  { label: 'Maize',      value: 'maize' },
  { label: 'Sugarcane',  value: 'sugarcane' },
  { label: 'Tea',        value: 'tea' },
  { label: 'Beans',      value: 'beans' },
  { label: 'Sorghum',    value: 'sorghum' },
  { label: 'Cassava',    value: 'cassava' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Sunflower',  value: 'sunflower' },
]

const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Active',       value: 'active' },
  { label: 'Fallow',       value: 'fallow' },
  { label: 'Harvested',    value: 'harvested' },
]

const healthOptions = [
  { label: 'All Health',      value: null },
  { label: 'Excellent (80+)', value: 'excellent' },
  { label: 'Good (60-79)',    value: 'good' },
  { label: 'Fair (40-59)',    value: 'fair' },
  { label: 'Poor (<40)',      value: 'poor' },
]

// ── Filtered list ─────────────────────────────────────────────
const filteredFarms = computed(() => {
  let list = farmsStore.farms

  if (selectedCrop.value)
    list = list.filter(f => f.crop_type === selectedCrop.value)

  if (selectedStatus.value)
    list = list.filter(f => f.status === selectedStatus.value)

  if (selectedHealth.value)
    list = list.filter(f => {
      const h = f.current_health?.score ?? 0
      if (selectedHealth.value === 'excellent') return h >= 80
      if (selectedHealth.value === 'good')      return h >= 60 && h < 80
      if (selectedHealth.value === 'fair')      return h >= 40 && h < 60
      if (selectedHealth.value === 'poor')      return h < 40
    })

  // global search applied via DataTable :filters prop
  return list
})

// ── Summary stats ─────────────────────────────────────────────
const stats = computed(() => {
  const farms  = farmsStore.farms
  const scores = farms.map(f => f.current_health?.score ?? 0)
  const avg    = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
  const area   = farms.reduce((s, f) => s + (parseFloat(f.area_ha) || 0), 0)

  return {
    total:    farms.length,
    active:   farms.filter(f => f.status === 'active').length,
    avg,
    area:     area.toFixed(1),
    critical: farms.filter(f => (f.current_health?.score ?? 0) < 40).length,
  }
})

// ── Helpers ───────────────────────────────────────────────────
function healthLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

function statusSeverity(s) {
  if (s === 'active')    return 'success'
  if (s === 'fallow')    return 'warn'
  if (s === 'harvested') return 'info'
  return 'secondary'
}

function moistureClass(status) {
  if (status === 'optimal') return 'text-blue-600'
  if (status === 'low')     return 'text-amber-500'
  if (status === 'high')    return 'text-red-500'
  return 'text-gray-400'
}

function resetFilters() {
  globalFilter.value   = ''
  selectedCrop.value   = null
  selectedStatus.value = null
  selectedHealth.value = null
}

onMounted(() => farmsStore.fetchFarms())
</script>

<template>
  <div class="farms-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Farm Registry</h1>
        <p class="page-subtitle">
          Monitor and manage all registered farms across Kakamega County
        </p>
      </div>
      <div class="flex gap-2">
        <Button
            icon="pi pi-map"
            label="Map View"
            severity="secondary"
            outlined
            @click="router.push('/')"
        />
        <Button
            icon="pi pi-plus"
            label="Register Farm"
            @click="router.push('/farms/add')"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon bg-blue-50 text-blue-600">
          <i class="pi pi-th-large"></i>
        </div>
        <div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Farms</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-green-50 text-green-600">
          <i class="pi pi-check-circle"></i>
        </div>
        <div>
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-indigo-50 text-indigo-600">
          <i class="pi pi-chart-line"></i>
        </div>
        <div>
          <div class="stat-value">{{ stats.avg }}<span class="stat-unit">/100</span></div>
          <div class="stat-label">Avg. Health</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-amber-50 text-amber-600">
          <i class="pi pi-map-marker"></i>
        </div>
        <div>
          <div class="stat-value">{{ stats.area }}<span class="stat-unit"> ha</span></div>
          <div class="stat-label">Total Area</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-red-50 text-red-600">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div>
          <div class="stat-value">{{ stats.critical }}</div>
          <div class="stat-label">Critical</div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <IconField class="flex-1 min-w-[200px]">
        <InputIcon class="pi pi-search" />
        <InputText
            v-model="globalFilter"
            placeholder="Search farms, crop types..."
            class="w-full"
        />
      </IconField>

      <Select
          v-model="selectedCrop"
          :options="cropOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Crop Type"
          class="w-44"
      />
      <Select
          v-model="selectedStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Status"
          class="w-40"
      />
      <Select
          v-model="selectedHealth"
          :options="healthOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Health"
          class="w-44"
      />
      <Button
          icon="pi pi-filter-slash"
          label="Clear"
          severity="secondary"
          outlined
          size="small"
          @click="resetFilters"
      />
    </div>

    <!-- DataTable -->
    <div class="table-wrapper">
      <DataTable
          :value="filteredFarms"
          :loading="farmsStore.loading"
          :globalFilterFields="['name', 'crop_type', 'status', 'irrigation', 'soil_type']"
          :filters="{ global: { value: globalFilter, matchMode: 'contains' } }"
          paginator
          :rows="15"
          :rowsPerPageOptions="[10, 15, 25, 50]"
          sortMode="multiple"
          removableSort
          stripedRows
          rowHover
          scrollable
          scrollHeight="flex"
          size="small"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Showing {first}–{last} of {totalRecords} farms"
          class="farms-table"
          @row-click="router.push(`/farms/${$event.data.id}`)"
      >

        <template #empty>
          <div class="py-16 text-center">
            <i class="pi pi-inbox text-5xl text-gray-200 block mb-4"></i>
            <p class="text-gray-500 font-medium">No farms match your filters</p>
            <Button label="Clear Filters" text size="small" class="mt-3" @click="resetFilters" />
          </div>
        </template>

        <template #loading>
          <div class="py-16 text-center">
            <i class="pi pi-spin pi-spinner text-3xl text-primary block mb-4"></i>
            <p class="text-gray-400">Loading farm data...</p>
          </div>
        </template>

        <!-- ID -->
        <Column field="id" header="ID" sortable style="width:64px">
          <template #body="{ data }">
            <span class="font-mono text-xs text-gray-400">#{{ data.id }}</span>
          </template>
        </Column>

        <!-- Farm Name -->
        <Column field="name" header="Farm Name" sortable style="min-width:200px">
          <template #body="{ data }">
            <p class="font-semibold text-gray-900 text-sm leading-tight">{{ data.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5 font-mono">
              {{ data.latitude?.toFixed(4) }}, {{ data.longitude?.toFixed(4) }}
            </p>
          </template>
        </Column>

        <!-- Crop -->
        <Column field="crop_type" header="Crop" sortable style="width:130px">
          <template #body="{ data }">
            <span class="crop-pill">{{ data.crop_type ?? '—' }}</span>
          </template>
        </Column>

        <!-- Area -->
        <Column field="area_ha" header="Area (ha)" sortable style="width:110px">
          <template #body="{ data }">
            <span class="text-sm font-medium text-gray-700">
              {{ parseFloat(data.area_ha || 0).toFixed(2) }}
            </span>
          </template>
        </Column>

        <!-- Health Score -->
        <Column
            field="current_health.score"
            header="Health Score"
            sortable
            style="width:180px"
        >
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div class="health-track">
                <div
                    class="health-fill"
                    :class="`health-fill--${getHealthSeverity(data.current_health?.score ?? 0)}`"
                    :style="{ width: `${data.current_health?.score ?? 0}%` }"
                />
              </div>
              <Tag
                  :value="healthLabel(data.current_health?.score ?? 0)"
                  :severity="getHealthSeverity(data.current_health?.score ?? 0)"
                  size="small"
                  class="shrink-0"
              />
            </div>
          </template>
        </Column>

        <!-- NDVI -->
        <Column field="current_health.ndvi" header="NDVI" sortable style="width:85px">
          <template #body="{ data }">
            <span class="font-mono text-sm text-gray-600">
              {{ data.current_health?.ndvi?.toFixed(3) ?? '—' }}
            </span>
          </template>
        </Column>

        <!-- Moisture -->
        <Column field="current_moisture.percent" header="Moisture" sortable style="width:120px">
          <template #body="{ data }">
            <span v-if="data.current_moisture" class="text-sm">
              <span class="font-medium text-gray-700">
                {{ parseFloat(data.current_moisture.percent).toFixed(1) }}%
              </span>
              <span class="text-xs ml-1" :class="moistureClass(data.current_moisture.status)">
                {{ data.current_moisture.status }}
              </span>
            </span>
            <span v-else class="text-gray-300 text-sm">—</span>
          </template>
        </Column>

        <!-- Irrigation -->
        <Column field="irrigation" header="Irrigation" sortable style="width:120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600 capitalize">
              {{ data.irrigation?.replace('_', ' ') ?? '—' }}
            </span>
          </template>
        </Column>

        <!-- Soil -->
        <Column field="soil_type" header="Soil Type" sortable style="width:120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600 capitalize">
              {{ data.soil_type?.replace('_', ' ') ?? '—' }}
            </span>
          </template>
        </Column>

        <!-- Status -->
        <Column field="status" header="Status" sortable style="width:110px">
          <template #body="{ data }">
            <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
                size="small"
            />
          </template>
        </Column>

        <!-- Planted -->
        <Column field="planting_date" header="Planted" sortable style="width:110px">
          <template #body="{ data }">
            <span class="text-xs text-gray-500">{{ data.planting_date ?? '—' }}</span>
          </template>
        </Column>

        <!-- Actions -->
        <Column header="" style="width:90px" frozen alignFrozen="right">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                  icon="pi pi-eye"
                  rounded text size="small"
                  severity="info"
                  v-tooltip.top="'View Details'"
                  @click.stop="router.push(`/farms/${data.id}`)"
              />
              <Button
                  icon="pi pi-map-marker"
                  rounded text size="small"
                  severity="secondary"
                  v-tooltip.top="'View on Map'"
                  @click.stop="router.push('/')"
              />
            </div>
          </template>
        </Column>

      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.farms-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: calc(100vh - 140px);
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}
.page-subtitle { font-size: 0.875rem; color: #6b7280; margin-top: 3px; }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px)  { .stats-row { grid-template-columns: repeat(2, 1fr); } }

.stat-card {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.05rem; flex-shrink: 0;
}
.stat-value { font-size: 1.5rem; font-weight: 800; color: #111827; line-height: 1; }
.stat-unit  { font-size: 0.875rem; font-weight: 500; color: #9ca3af; }
.stat-label { font-size: 0.7rem; color: #9ca3af; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* Table wrapper */
.table-wrapper {
  flex: 1;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  min-height: 0;
}

/* Crop pill */
.crop-pill {
  display: inline-block;
  padding: 2px 10px;
  background: #f0f9ff;
  color: #0369a1;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  border: 1px solid #bae6fd;
}

/* Health bar */
.health-track {
  flex: 1;
  height: 5px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}
.health-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.health-fill--success { background: #22c55e; }
.health-fill--info    { background: #3b82f6; }
.health-fill--warn    { background: #f59e0b; }
.health-fill--danger  { background: #ef4444; }

/* Row click cursor */
:deep(.farms-table .p-datatable-tbody > tr) {
  cursor: pointer;
}
:deep(.farms-table .p-datatable-tbody > tr:hover td) {
  background: #f8faff !important;
}
</style>